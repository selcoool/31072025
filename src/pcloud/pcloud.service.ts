import { Injectable } from '@nestjs/common';
import axios from 'axios';
import * as FormData from 'form-data';
import * as fs from 'fs';

const USERNAME = 'trmthanh220895@gmail.com';
const PASSWORD = 'Minhthanh220895@';
const BASE_URL = 'https://api.pcloud.com';

let _authToken: string | null = null;

@Injectable()
export class PCloudService {
  // 🔐 Login & Cache Token
  private async login(): Promise<string> {
    if (_authToken) return _authToken;

    const res = await axios.get(`${BASE_URL}/login`, {
      params: { getauth: 1, username: USERNAME, password: PASSWORD },
    });

    if (res.data.result !== 0) {
      throw new Error(`Login failed: ${res.data.error}`);
    }

    _authToken = res.data.auth;
    return _authToken;
  }

  // 🚀 Upload File to Root Folder (folderid = 0)
  async uploadFile(filePath: string): Promise<any> {
    const auth = await this.login();

    const form = new FormData();
    form.append('auth', auth);
    form.append('folderid', 0);  // Upload vào Root
    form.append('file', fs.createReadStream(filePath));

    const uploadRes = await axios.post(`${BASE_URL}/uploadfile`, form, { headers: form.getHeaders() });

    if (uploadRes.data.result !== 0) {
      throw new Error(`Upload failed: ${uploadRes.data.error}`);
    }

    const uploaded = uploadRes.data.metadata[0];
    const links = await this.getFileLinks(auth, uploaded.fileid);

    return {
      name: uploaded.name,
      fileid: uploaded.fileid,
      publink: links.publink,
      direct_link: links.directLink,
    };
  }

  // 🌐 Get Public Link & Direct Link (Retry 5 times if needed)
  private async getFileLinks(auth: string, fileid: number): Promise<{ publink: string | null; directLink: string | null }> {
    const publinkRes = await axios.get(`${BASE_URL}/getfilepublink`, {
      params: { auth, fileid },
    });

    const publink = publinkRes.data.result === 0 ? publinkRes.data.link : null;

    let directLink: string | null = null;
    let attempts = 0;

    while (attempts < 5) {
      const filelinkRes = await axios.get(`${BASE_URL}/getfilelink`, {
        params: { auth, fileid },
      });

      if (filelinkRes.data.result === 0 && filelinkRes.data.hosts && filelinkRes.data.hosts.length > 0) {
        const host = filelinkRes.data.hosts[0];
        const path = filelinkRes.data.path;
        directLink = `https://${host}${path}`;
        break;
      }

      attempts++;
      console.log(`Attempt ${attempts}: Waiting for direct link...`);
      await new Promise(resolve => setTimeout(resolve, 2000));  // Wait 2s before retry
    }

    return { publink, directLink };
  }
}



// import { Injectable } from '@nestjs/common';
// import axios from 'axios';
// import * as FormData from 'form-data';
// import * as fs from 'fs';

// const USERNAME = 'trmthanh220895@gmail.com';
// const PASSWORD = 'Minhthanh220895@';
// const BASE_URL = 'https://api.pcloud.com';


// // const USERNAME = 'trmthanh220895@gmail.com';
// // const PASSWORD = 'Minhthanh220895@';
// // const DEFAULT_FOLDER = 'upload_images';
// // const BASE_URL = 'https://api.pcloud.com';

// @Injectable()
// export class PCloudService {
//   private _authToken: string | null = null;

//   private async login(): Promise<string> {
//     if (this._authToken) return this._authToken;
//     const res = await axios.get(`${BASE_URL}/login`, {
//       params: { getauth: 1, username: USERNAME, password: PASSWORD },
//     });
//     if (res.data.result !== 0) throw new Error(`Login failed: ${res.data.error}`);
//     this._authToken = res.data.auth;
//     return this._authToken;
//   }

//   async uploadFile(filePath: string): Promise<any> {
//     const auth = await this.login();

//     const form = new FormData();
//     form.append('auth', auth);
//     form.append('file', fs.createReadStream(filePath));

//     const uploadRes = await axios.post(`${BASE_URL}/uploadfile`, form, { headers: form.getHeaders() });

//     if (uploadRes.data.result !== 0) {
//       throw new Error(`Upload failed: ${uploadRes.data.error}`);
//     }

//     const uploaded = uploadRes.data.metadata[0];
//     return {
//       name: uploaded.name,
//       fileid: uploaded.fileid,
//     };
//   }
// }




// // src/pcloud/pcloud.service.ts
// import { Injectable } from '@nestjs/common';
// import axios from 'axios';
// import * as FormData from 'form-data';
// import * as fs from 'fs';

// const USERNAME = 'trmthanh220895@gmail.com';
// const PASSWORD = 'Minhthanh220895@';
// const DEFAULT_FOLDER = 'upload_images';
// const BASE_URL = 'https://api.pcloud.com';

// let _authToken: string | null = null;

// interface UploadResult {
//   name: string;
//   size_kb: string;
//   fileid: number;
//   publink: string | null;
//   direct_link: string | null;
// }

// @Injectable()
// export class PCloudService {
//   private async pcloudLogin(): Promise<string> {
//     if (_authToken) return _authToken;

//     const res = await axios.get(`${BASE_URL}/login`, {
//       params: { getauth: 1, username: USERNAME, password: PASSWORD },
//     });

//     if (res.data.result !== 0) {
//       _authToken = null;
//       throw new Error(`Login failed: ${res.data.error}`);
//     }

//     _authToken = res.data.auth;
//     return _authToken;
//   }

//   private async safeApiCall(apiFn: () => Promise<any>): Promise<any> {
//     let res = await apiFn();
//     if (res.data.result === 2000) {
//       _authToken = null;
//       await this.pcloudLogin();
//       res = await apiFn();
//     }
//     return res;
//   }

//   private async getFolderId(auth: string, folderName: string): Promise<number> {
//     const listRes = await this.safeApiCall(() =>
//       axios.get(`${BASE_URL}/listfolder`, { params: { auth, folderid: 0 } })
//     );

//     for (const item of listRes.data.metadata.contents || []) {
//       if (item.isfolder && item.name === folderName) {
//         return item.folderid;
//       }
//     }

//     const createRes = await this.safeApiCall(() =>
//       axios.get(`${BASE_URL}/createfolder`, { params: { auth, name: folderName, folderid: 0 } })
//     );

//     if (createRes.data.result !== 0) {
//       throw new Error(`Create folder failed: ${createRes.data.error}`);
//     }

//     return createRes.data.metadata.folderid;
//   }

//   private async getFileLinks(auth: string, fileid: number): Promise<{ publink: string | null; directLink: string | null }> {
//     const publinkRes = await this.safeApiCall(() =>
//       axios.get(`${BASE_URL}/getfilepublink`, { params: { auth, fileid } })
//     );

//     const publink = publinkRes.data.result === 0 ? publinkRes.data.link : null;

//     const filelinkRes = await this.safeApiCall(() =>
//       axios.get(`${BASE_URL}/getfilelink`, { params: { auth, fileid } })
//     );

//     let directLink = null;
//     if (filelinkRes.data.result === 0) {
//       const host = filelinkRes.data.hosts[0];
//       const path = filelinkRes.data.path;
//       directLink = `https://${host}${path}`;
//     }

//     return { publink, directLink };
//   }

//   async uploadImageToPCloud(filePath: string, fileName?: string, folderName: string = DEFAULT_FOLDER): Promise<UploadResult> {
//     const auth = await this.pcloudLogin();
//     const folderId = await this.getFolderId(auth, folderName);

//     const fileBaseName = fileName || filePath.split('/').pop()!;
//     const dotIndex = fileBaseName.lastIndexOf('.');
//     const filenameNoExt = fileBaseName.substring(0, dotIndex);
//     const ext = fileBaseName.substring(dotIndex + 1);

//     const listRes = await this.safeApiCall(() =>
//       axios.get(`${BASE_URL}/listfolder`, { params: { auth, folderid: folderId } })
//     );

//     const existingFiles = (listRes.data.metadata.contents || [])
//       .filter((item) => !item.isfolder)
//       .map((item) => item.name);

//     let finalFileName = fileBaseName;
//     if (existingFiles.includes(fileBaseName)) {
//       const uniqueSuffix = Date.now();
//       finalFileName = `${filenameNoExt}_${uniqueSuffix}.${ext}`;
//     }

//     const form = new FormData();
//     form.append('auth', auth);
//     form.append('folderid', folderId);
//     form.append('file', fs.createReadStream(filePath), finalFileName);

//     const uploadRes = await this.safeApiCall(() =>
//       axios.post(`${BASE_URL}/uploadfile`, form, { headers: form.getHeaders() })
//     );

//     if (uploadRes.data.result !== 0) {
//       throw new Error(`Upload failed: ${uploadRes.data.error}`);
//     }

//     const uploaded = uploadRes.data.metadata[0];
//     const { publink, directLink } = await this.getFileLinks(auth, uploaded.fileid);

//     return {
//       name: uploaded.name,
//       size_kb: (uploaded.size / 1024).toFixed(2),
//       fileid: uploaded.fileid,
//       publink,
//       direct_link: directLink,
//     };
//   }
// }

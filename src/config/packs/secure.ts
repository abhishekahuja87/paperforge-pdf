import secure from '../../locales/packs/secure.catalog.en.json';
import { definePackTool, type PackTool } from './types';

/** Private documents: write a document and lock it with a password (the home tile), or lock any file you already have. One maker; the two buttons are links to their own addresses. Everything is locked in the browser with WebCrypto (PBKDF2 and AES-256-GCM), so nothing is uploaded. */
export const SECURE_TOOLS: PackTool[] = [
  definePackTool({
    id: 'password-protected-document-maker', kind: 'secureDocument', guideKey: 'privateDocumentGuide', category: 'everyday', icon: 'lock', tier: 'popular',
    keywords: ['password protect document', 'password protected html file', 'encrypt document online', 'send confidential document without uploading', 'secure document maker', 'create password protected page', 'private word processor', 'word processor in browser no upload', 'free word alternative no upload', 'lock a letter with password', 'share confidential document safely', 'encrypted document sender', 'password protected offer letter', 'write and encrypt a document'],
  }, secure.toolCatalog),
  definePackTool({
    id: 'lock-a-file-with-password', kind: 'secureFile', guideKey: 'lockFileGuide', category: 'everyday', icon: 'shield-check', tier: 'more',
    keywords: ['password protect pdf without uploading', 'encrypt file with password online', 'lock a word file with password', 'password protect excel file', 'encrypt any file', 'password protect zip online', 'aes 256 file encryption in browser', 'send file securely without cloud', 'password protect photo', 'encrypt pdf offline', 'password protect a file free', 'lock a file with password'],
  }, secure.toolCatalog),
];

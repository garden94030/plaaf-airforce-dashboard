# PLAAF Air Force Dashboard

可公開分享的 PLAAF 空軍儀表板展示專案，已整理為兩種用途：

- `GitHub Pages`：直接提供所有人以手機或桌機瀏覽的公開展示版
- `Cloud Run / Docker`：保留原始 Node + Express + SQLite 架構，方便之後升級回完整後端版

## 公開展示網址

GitHub Pages 啟用後，預設網址會是：

`https://garden94030.github.io/plaaf-airforce-dashboard/`

## 展示帳號

- 管理者：`admin` / `admin123`
- 操作員：`operator` / `op2026`

## 手機使用建議

- 直式瀏覽：適合總覽、人員編制、裝備卡片
- 橫式瀏覽：適合任務表格、基地部署、管理頁表格

## 本機預覽 GitHub Pages 版

```powershell
python -m http.server 4173
```

另開瀏覽器後前往：

`http://127.0.0.1:4173/login.html`

## 本機啟動完整後端版

```powershell
cd server
npm ci
node index.js
```

啟動後可由：

`http://127.0.0.1:3001/login.html`

登入使用。

## 目錄說明

- `index.html` / `script.js` / `style.css`：主儀表板
- `login.html` / `login.js` / `login.css`：登入頁與公開展示登入流程
- `data/`：GitHub Pages 版使用的靜態 JSON
- `server/`：原始 Node/Express/SQLite 伺服器程式

## 部署說明

### GitHub Pages

直接由 `main` branch 的 repository root 發佈即可。

### Google Cloud Run

此 repo 已附 `Dockerfile`，後續安裝 `gcloud` 後即可部署：

```powershell
gcloud run deploy plaaf-airforce-dashboard --source . --region asia-east1 --allow-unauthenticated
```

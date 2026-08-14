# 卷宗台｜小說 IP 管理庫

以作品為中心，管理小說話數、角色、服裝、場景與圖像資產。

## GitHub Pages

本專案已附上 `.github/workflows/pages.yml`。將專案推送到 GitHub 的 `main` 分支後，GitHub Actions 會自動發布網站。

1. 建立一個 GitHub Repository，例如 `story-atlas`。
2. 將本資料夾全部上傳至 `main` 分支。
3. 到 Repository 的 `Settings → Pages`，確認 Source 使用 GitHub Actions。
4. 等待 Actions 完成，網站網址會顯示在 workflow 的 deployment environment。

Supabase 負責登入與雲端資料；GitHub Pages 負責發布前端網站。

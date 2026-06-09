Dr.S - One-page AI Trends Site

이 저장소는 단일 페이지 기업 소개 사이트(`index.html`)를 포함합니다.

빠른 배포 옵션

1) GitHub Pages (권장, 무료)
- 준비: GitHub에 새 리포지토리 생성 (예: `drs-site`).
- 로컬에서 실행:

```bash
cd /path/to/copilotstudy
git init
git add .
git commit -m "Initial site"
# 원격 리포지토리 추가(사용자 repo URL로 바꿀 것)
git remote add origin https://github.com/USERNAME/REPO.git
# main 브랜치로 푸시
git branch -M main
git push -u origin main
```
- GitHub 리포지토리 설정에서 `Settings` → `Pages`로 이동해 `Deploy from branch`를 선택하고 `main` 브랜치의 `/ (root)`를 선택하면 사이트가 활성화됩니다.

2) Netlify (간편, CI 포함)
- Netlify 계정 생성 후 `New site from Git` 선택 → GitHub 연동 → 리포지토리 선택 → 배포 설정(빌드 필요 없음) → `Deploy site` 클릭.
- 또는 CLI로:

```bash
npm install -g netlify-cli
netlify login
netlify deploy --dir=. --prod
```

3) 로컬 서버 + ngrok (빠른 테스트, 임시 공개)
- Python 로컬 서버:

```bash
python3 -m http.server 8000
# 또는
npx http-server -p 8000
```
- ngrok으로 공개:

```bash
ngrok http 8000
```

주의 및 팁
- `site-background.jpg` 파일을 이 폴더에 넣으면 히어로 영역 백그라운드로 자동 사용됩니다.
- GitHub Pages는 `index.html`을 기본 문서로 사용합니다. 이미 `index.html`이 있으므로 루트로 푸시하면 됩니다.
- 추가로 원하시면 제가 `CNAME` 파일 생성(사용자 도메인) 또는 Netlify 배포 설정 도와드릴게요.

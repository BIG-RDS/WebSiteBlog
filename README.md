# All About the World 🌍

A static website that curates information from around the world. It presents well-organized posts in categories such as **Stock Analysis** and **Travel**, and is ready to deploy with GitHub Pages.

- Site name: All About the World
- Planned domain: `airsky.com`
- Contact email: `ikgyubae@gmail.com`

## Directory Structure

```
.
├── index.html          # Home page (latest posts from every category)
├── contact.html        # Email contact form
├── style.css           # Global responsive styles
├── script.js           # Shared data loading, search/filter, and form logic
├── _config.yml         # GitHub Pages configuration
├── data/
│   ├── stocks.json     # Stock analysis post data
│   └── travel.json     # Travel post data
├── stock/
│   ├── index.html      # Stock analysis list page
│   └── post.html       # Stock analysis detail page (select a post with ?slug=)
└── travel/
    ├── index.html      # Travel list page
    └── post.html       # Travel detail page (select a post with ?slug=)
```

## Adding a New Post

This site uses JSON-based content management. Add an object to `data/stocks.json` or `data/travel.json`; no new HTML file is required. The post will automatically appear on the list, home, and detail pages.

### Stock Analysis Post Example (`data/stocks.json`)

```json
{
  "slug": "lg-energy-solution",
  "title": "LG Energy Solution (373220) Stock Analysis",
  "ticker": "373220",
  "category": "stock",
  "summary": "A one-line summary",
  "image": "https://example.com/image.jpg",
  "tags": ["Secondary Batteries", "Large Cap"],
  "date": "2026-08-20",
  "link": "https://finance.naver.com/item/main.naver?code=373220",
  "content": [
    "Analysis paragraph 1",
    "Analysis paragraph 2"
  ]
}
```

### Travel Post Example (`data/travel.json`)

```json
{
  "slug": "gyeongju",
  "title": "Gyeongju Travel Guide",
  "location": "Gyeongju, South Korea",
  "category": "travel",
  "summary": "A one-line summary",
  "image": "https://example.com/image.jpg",
  "tags": ["History", "Day Trip"],
  "date": "2026-08-22",
  "link": "https://example.com",
  "content": [
    "Travel information paragraph 1",
    "Travel information paragraph 2"
  ]
}
```

Use a unique slug containing English letters, numbers, and hyphens because it is used in the URL.

## Adding a New Category (for Example, News)

1. Create `data/news.json` and add post data using the format above.
2. Copy the files in `stock/` to create `news/index.html` and `news/post.html`, then update their content.
3. Add an entry to the `CATEGORIES` object in `script.js`:

   ```js
   news: {
     label: "News",
     dataUrl: "data/news.json",
     listPath: "news/index.html",
     postPath: "news/post.html",
   },
   ```

4. Use the existing `.badge.news` color in `style.css`, or change it as needed.
5. Add the category link to each page's navigation (`<nav class="site-nav">`).

## Local Preview

Browser CORS policies can prevent JSON data from loading when pages are opened directly with `file://`. Start a simple local server instead:

```bash
python3 -m http.server 8000
# Then open http://localhost:8000 in a browser.
```

## GitHub Pages Deployment

1. Open the repository's **Settings → Pages** page.
2. Set the source to `Deploy from a branch`, select `main` (or a deployment branch), and choose the `/root` directory.
3. After saving, the site is available at `https://<username>.github.io/<repository>/`.

## Connecting the Custom Domain (`airsky.com`)

1. **Configure the domain DNS** with the domain registrar:
   - Add these four `A` records to `@` (the root domain):
     ```
     185.199.108.153
     185.199.109.153
     185.199.110.153
     185.199.111.153
     ```
   - To use `www`, add a `CNAME` record from `www` to `<username>.github.io`.
2. **Configure the GitHub repository**:
   - Create a `CNAME` file in the repository root containing only `airsky.com`.
   - Or enter `airsky.com` under **Settings → Pages → Custom domain**.
3. DNS propagation can take from a few minutes up to 24 hours. Once it completes, enable **Enforce HTTPS** in GitHub Pages settings to provision HTTPS automatically.

> ⚠️ Adding the `CNAME` file before DNS points to `airsky.com` can make the site temporarily unavailable. Configure the DNS records first.

## Contact

Use the email contact form in `contact.html` to send a message to `ikgyubae@gmail.com`.

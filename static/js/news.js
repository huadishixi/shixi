const news = "static/dataset/news.json";
const container = document.querySelector(".visualSssf_content");
const newsList = document.querySelector(".news-list");

fetch(news)
  .then((response) => response.json())
  .then((data) => {
    // 1. 渲染新闻列表（复制一份实现无缝循环）
    let html = "";
    data.forEach((item) => {
      html += `
        <div class="news-item">
          <a href="${item.链接}" target="_blank">${item.标题}</a>
        </div>
      `;
    });
    newsList.innerHTML = html + html; // 关键点：复制数据

    // 2. 动态计算动画时间
    const singleScrollTime = data.length * 2;
    newsList.style.animation = `scrollUp ${singleScrollTime}s linear infinite`;

    // 3. 悬停暂停动画
    newsList.addEventListener("mouseenter", () => {
      newsList.style.animationPlayState = "paused";
    });
    newsList.addEventListener("mouseleave", () => {
      newsList.style.animationPlayState = "running";
    });
  })
  .catch((error) => {
    console.error("加载新闻失败:", error);
  });

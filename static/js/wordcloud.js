const maskImageSrc = "static/images/yuntu.png";
const wordFreqJSON = "static/dataset/word_freq.json";
const initialNewsJSON = "static/dataset/news.json"; // 初始新闻数据路径
const wordNewsJSON = "static/dataset/word_news.json"; // 关键词新闻数据路径

// ECharts 容器ID
const containerId = "wordcloud";
let chart;
const wcObserver = new ResizeObserver(() => {
  chart.resize();
});

let initialNewsData = []; // 保存初始新闻数据

// 创建词云图
function createMedicalWordCloud() {
  chart = echarts.init(document.getElementById(containerId));

  var maskImage = new Image();
  maskImage.src = maskImageSrc;

  // 等图片加载完再画图
  maskImage.onload = function () {
    Promise.all([
      fetch(wordFreqJSON).then((res) => res.json()),
      fetch(wordNewsJSON).then((res) => res.json()),
      fetch(initialNewsJSON).then((res) => res.json()), // 加载初始新闻数据
    ])
      .then(([wordsList, newsData, initialData]) => {
        initialNewsData = initialData; // 保存初始数据

        // 渲染初始新闻列表
        renderNewsList(initialNewsData, "医学资讯");

        // 按词频降序
        wordsList.sort((a, b) => b.value - a.value);
        var topWords = wordsList.slice(0, 35);

        var option = {
          tooltip: {},
          series: [
            {
              type: "wordCloud",
              maskImage: maskImage,
              left: "center",
              top: "center",
              width: "90%",
              height: "85%",
              sizeRange: [20, 45],
              rotationRange: [0, 0],
              gridSize: 1,
              drawOutOfBound: false,
              textStyle: {
                color: function () {
                  return (
                    "rgb(" +
                    [
                      Math.round(Math.random() * 55 + 200),
                      Math.round(Math.random() * 55 + 200),
                      Math.round(Math.random() * 55 + 200),
                    ].join(",") +
                    ")"
                  );
                },
              },
              emphasis: {
                focus: "self",
                textStyle: {
                  shadowBlur: 8,
                  shadowColor: "#333",
                },
              },
              data: topWords,
            },
          ],
        };

        wcObserver.observe(document.getElementById(containerId));
        chart.setOption(option);

        // 添加点击事件监听
        chart.on("click", function (params) {
          const clickedWord = params.name;
          const relatedNews = newsData[clickedWord];

          // 修改标题并渲染相关新闻
          renderNewsList(
            relatedNews || [],
            relatedNews && relatedNews.length > 0
              ? `与"${clickedWord}"相关的医学资讯`
              : `暂无与"${clickedWord}"相关的新闻`,
            clickedWord
          );
        });
      })
      .catch((error) => {
        console.error("加载数据失败:", error);
      });
  };
}

// 渲染新闻列表的通用函数
function renderNewsList(newsData, title, keyword = null) {
  const newsList = document.querySelector(".news-list");
  const titleElement = document.querySelector(".visualSssf_left h3");

  // 更新标题
  if (titleElement) {
    titleElement.innerHTML = `${title}<button class="news-reply"><span>&#128472;</span></button>`;
  }

  const replyBtn = document.querySelector(".news-reply");
  replyBtn.addEventListener(
    "click",
    function () {
      renderNewsList(initialNewsData, "医学资讯");
    },
    { once: true }
  );

  // 如果没有数据或数据为空
  if (!newsData || newsData.length === 0) {
    const noDataMsg = keyword
      ? `暂无与"${keyword}"相关的新闻`
      : "暂无最新医学资讯";
    newsList.innerHTML = `<div class="news-item"><span>${noDataMsg}</span></div>`;
    newsList.style.animation = "none";
    return;
  }

  // 渲染新闻 HTML（复制一份用于无缝滚动）
  let html = "";
  newsData.forEach((item) => {
    const url = item.url || item.链接; // 兼容两种数据结构
    const title = item.title || item.标题;
    html += `
      <div class="news-item">
        <a href="${url}" target="_blank">${title}</a>
      </div>
    `;
  });
  newsList.innerHTML = html + html;

  // 动态计算动画时间（每条新闻 2s 滚动）
  const scrollTime = newsData.length * 2;
  newsList.style.animation = `scrollUp ${scrollTime}s linear infinite`;

  // 重新绑定悬停事件（因为innerHTML会清除之前的事件监听）
  newsList.addEventListener("mouseenter", () => {
    newsList.style.animationPlayState = "paused";
  });
  newsList.addEventListener("mouseleave", () => {
    newsList.style.animationPlayState = "running";
  });
}

// 自动执行
document.addEventListener("DOMContentLoaded", function () {
  createMedicalWordCloud();
});

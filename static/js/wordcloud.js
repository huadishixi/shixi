const maskImageSrc = "/static/images/yuntu.png";
const wordFreqJSON = "/static/dataset/word_freq.json";

// ECharts 容器ID
const containerId = "wordcloud"; // 对应HTML里的 <div id="wordcloud"></div>
let chart;
const wcObserver = new ResizeObserver(() => {
  chart.resize();
});

// 创建词云图
function createMedicalWordCloud() {
  chart = echarts.init(document.getElementById(containerId));

  var maskImage = new Image();
  maskImage.src = maskImageSrc;

  // 等图片加载完再画图
  maskImage.onload = function () {
    Promise.all([
      fetch(wordFreqJSON).then((res) => res.json()),
      fetch("/static/dataset/word_news.json").then((res) => res.json()),
    ])
      .then(([wordsList, newsData]) => {
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
              rotationRange: [0, 0], // 固定方向，性能高
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

        // 添加点击事件监听，contop 改变，变成关键词对应的新闻
        chart.on("click", function (params) {
          const clickedWord = params.name;
          const newsList = document.querySelector(".news-list");

          if (!newsList) {
            console.warn("新闻列表模块未找到！");
            return;
          }

          const relatedNews = newsData[clickedWord];

          // 修改标题区域
          const titleElement = document.querySelector(
            "body > div:nth-child(2) > div:nth-child(2) > div:nth-child(2) > div:nth-child(1) > div:nth-child(1) > h3"
          );
          if (titleElement) {
            titleElement.textContent = `与"${clickedWord}"相关的医学资讯`;
          }

          if (!relatedNews || relatedNews.length === 0) {
            newsList.innerHTML = `<div class="news-item"><span>暂无与 “${clickedWord}” 相关的新闻</span></div>`;
            newsList.style.animation = "none"; // 无新闻时不滚动
            return;
          }

          // 渲染新闻 HTML（复制一份用于无缝滚动）
          let html = "";
          relatedNews.forEach((item) => {
            html += `
              <div class="news-item">
                <a href="${item.url}" target="_blank">${item.title}</a>
              </div>
            `;
          });
          newsList.innerHTML = html + html; // 复制一份实现无缝滚动

          // 动态计算动画时间（每条新闻 2s 滚动）
          const scrollTime = relatedNews.length * 2;
          newsList.style.animation = `scrollUp ${scrollTime}s linear infinite`;

          // 悬停暂停动画
          newsList.addEventListener("mouseenter", () => {
            newsList.style.animationPlayState = "paused";
          });
          newsList.addEventListener("mouseleave", () => {
            newsList.style.animationPlayState = "running";
          });
        });
      })
      .catch((error) => {
        console.error("加载词频数据失败:", error);
      });
  };
}

// 自动执行
document.addEventListener("DOMContentLoaded", createMedicalWordCloud);

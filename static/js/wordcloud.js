const maskImageSrc = "/static/data/wordcloud/yuntu.png";
const wordFreqJSON = "/static/data/output/word_freq.json";
const wordNewsJSON = '/static/data/output/word_news.json';

// ECharts 容器ID
const containerId = 'main';  // 对应HTML里的 <div id="main"></div>

// 创建词云图
function createMedicalWordCloud() {
  var chart = echarts.init(document.getElementById(containerId));

  var maskImage = new Image();
  maskImage.src = maskImageSrc;

  // 等图片加载完再画图
  maskImage.onload = function () {
  Promise.all([
    fetch(wordFreqJSON).then(r => r.json()),
    fetch(wordNewsJSON).then(r => r.json())
  ]).then(([wordsList,wordNews]) => {
        // 按词频降序
        wordsList.sort((a, b) => b.value - a.value);
        var topWords = wordsList.slice(0, 35);

        var option = {
          tooltip: {},
          series: [{
            type: 'wordCloud',
            maskImage: maskImage,
            left: 'center',
            top: 'center',
            width: '90%',
            height: '90%',
            sizeRange: [20, 60],
            rotationRange: [0, 0],  // 固定方向，性能高
            gridSize: 1,
            drawOutOfBound: false,
            textStyle: {
              color: function () {
                return 'rgb(' + [
                  Math.round(Math.random() * 100),
                  Math.round(Math.random() * 100),
                  Math.round(Math.random() * 100)
                ].join(',') + ')';
              }
            },
            emphasis: {
              focus: 'self',
              textStyle: {
                shadowBlur: 8,
                shadowColor: '#333'
              }
            },
            data: topWords
          }]
        };

        chart.setOption(option);
        chart.on('click',function(params){
            var word = params.name;
            var newlist = wordNews[word] || [];

            var html = '';
            if (newlist.length === 0){
                html = `<p>暂无相关新</p>`;
            }
            else {
                html = '<div class="list-group">';
                newlist.forEach(item => {
                  html += `
                    <a href="${item.url}" target="_blank" class="list-group-item list-group-item-action">
                      ${item.title}
                    </a>
                  `;
                });
                html += '</div>';
            }

            document.getElementById('word-news-body').innerHTML = html;

            var modal = new bootstrap.Modal(document.getElementById('word-news-modal'));
            modal.show();
        })
      })
      .catch(error => {
        console.error('加载词频数据失败:', error);
      });
  };
}

// 自动执行
document.addEventListener("DOMContentLoaded", createMedicalWordCloud);

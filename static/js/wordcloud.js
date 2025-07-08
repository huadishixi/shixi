const maskImageSrc = '../static/data/wordcloud/yuntu.png';
const wordFreqJSON = '../static/data/output/word_freq.json';

// ECharts 容器ID
//const containerId = 'wordcloud';  // 对应HTML里的 <div id="wordcloud"></div>

const t = document.querySelector('#wordcloud');
// 创建词云图
function createMedicalWordCloud() {
  var chart = echarts.init(t);

  var maskImage = new Image();
  maskImage.src = maskImageSrc;

  // 等图片加载完再画图
  maskImage.onload = function () {
    fetch(wordFreqJSON)
      .then(response => response.json())
      .then(wordsList => {
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
      })
      .catch(error => {
        console.error('加载词频数据失败:', error);
      });
  };
}

// 自动执行
document.addEventListener('DOMContentLoaded', createMedicalWordCloud);

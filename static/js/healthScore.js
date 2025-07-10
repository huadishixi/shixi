const hsDOM = document.getElementById("main1");
let hsChart;
const hsObserver = new ResizeObserver(() => {
  hsChart.resize();
});

fetch("static/dataset/health_scores.json")
  .then((res) => res.json())
  .then((data) => {
    const ageData = data.map((item) => item.年龄段);
    const scoreData = data.map((item) => item.平均健康评分);
    const populationData = data.map((item) => item.人数);
    const SDData = data.map((item) => item.标准差);

    if (hsChart) {
      hsChart.clear();
    } else {
      hsChart = echarts.init(hsDOM);
    }

    const option1 = {
      tooltip: { trigger: "axis" },
      legend: {
        data: ["平均健康评分", "人数"],
        textStyle: {
          color: "white",
        },
      },
      grid: {
        left: "5%",
        right: "5%",
        bottom: "10%",
        containLabel: true,
      },
      xAxis: {
        type: "category",
        data: ageData,
        axisLabel: {
          color: "white",
        },
      },
      yAxis: [
        {
          type: "value",
          name: "平均健康评分",
          axisLabel: {
            color: "white",
          },
          nameTextStyle: {
            color: "white",
          },
        },
        {
          type: "value",
          name: "人数",
          scale: true,
          axisLabel: {
            color: "white",
          },
          nameTextStyle: {
            color: "white",
          },
        },
      ],
      series: [
        {
          name: "平均健康评分",
          type: "bar",
          data: scoreData,
        },
        {
          name: "人数",
          type: "bar",
          yAxisIndex: 1,
          data: populationData,
        },
      ],
    };

    const option2 = {
      tooltip: {
        trigger: "axis",
        axisPointer: { type: "shadow" },
      },
      legend: {
        data: ["平均健康评分", "标准差"],
        textStyle: {
          color: "white",
        },
      },
      xAxis: {
        type: "category",
        data: ageData,
        axisLabel: { color: "white" },
      },
      yAxis: [
        {
          type: "value",
          name: "健康评分",
          axisLine: { lineStyle: { color: "white" } },
          axisLabel: { color: "white" },
        },
        {
          type: "value",
          name: "标准差",
          axisLine: { lineStyle: { color: "white" } },
          axisLabel: { color: "white" },
        },
      ],
      series: [
        // 柱状图
        {
          name: "平均健康评分",
          type: "bar",
          barWidth: "40%",
          data: scoreData,
          itemStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: "#83bff6" },
              { offset: 1, color: "#188df0" },
            ]),
          },
        },
        // 折线图
        {
          name: "标准差",
          type: "line",
          yAxisIndex: 1,
          data: SDData,
          symbol: "circle",
          symbolSize: 8,
          lineStyle: { width: 3, color: "#EE6666" },
          itemStyle: { color: "#EE6666" },
        },
      ],
    };

    const option3 = {
      tooltip: {},
      radar: {
        indicator: [
          { name: "平均健康评分", max: 100, color: "white" },
          {
            name: "人数",
            max: Math.max(...data.map((d) => d.人数)) + 1000,
            color: "white",
          },
          { name: "标准差", max: 10, color: "white" },
        ],
        center: ["50%", "60%"],
        radius: "90%",
      },
      series: [
        {
          type: "radar",
          data: data.map((item) => ({
            value: [item.平均健康评分, item.人数, item.标准差],
            name: item.年龄段,
          })),
          areaStyle: { opacity: 0.3 },
        },
      ],
    };

    hsObserver.observe(hsDOM);

    hsChart && hsChart.setOption(option1);

    const options = [option1, option2, option3];
    let currentOptionIndex = 0;

    function switchChartWithAnimation() {
      currentOptionIndex = (currentOptionIndex + 1) % options.length;
      const nextOption = options[currentOptionIndex];

      // 1. 当前图表淡出（透明度从1降到0）
      hsDOM.style.transition = "opacity 0.5s ease";
      hsDOM.style.opacity = 0;

      // 2. 延迟500ms后加载新图表并淡入
      setTimeout(() => {
        hsChart.clear();
        hsChart.setOption(nextOption, true);
        hsDOM.style.opacity = 1;
      }, 500);
    }

    // 每隔5秒切换一次（包含动画）
    setInterval(switchChartWithAnimation, 5000);
  });

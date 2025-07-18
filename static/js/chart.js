let netChart;
const netObserver = new ResizeObserver(() => {
  netChart.resize();
});
(function () {
  netChart = echarts.init(document.getElementById("main2"));
  const colorMap = {
    疾病: "#5470c6",
    年龄段: "#91cc75",
    性别: "#fac858",
    区域: "#ee6666",
  };

  Promise.all([
    fetch("/static/dataset/network_data.json").then((r) => r.json()),
    fetch("/static/dataset/correlation_matrix.json").then((r) => r.json()),
  ])
    .then(([network, corrData]) => {
      const categories = Object.keys(colorMap);
      const diseases = corrData.疾病;
      const matrix = corrData.matrix;

      const nodes = network.nodes.map((node) => ({
        id: node.id,
        name: node.id,
        category: categories.indexOf(node.group),
        symbolSize: node.group === "disease" ? 10 : 5,
        itemStyle: { color: colorMap[node.group] },
      }));

      const links = network.links.map((link) => {
        const { source, target, value } = link;
        const i = diseases.indexOf(source);
        const j = diseases.indexOf(target);
        if (i >= 0 && j >= 0) {
          const corr = matrix[i][j];
          return {
            source,
            target,
            value: corr,
            lineStyle: {
              width: corr * 8,
              color: colorMap.疾病,
              opacity: Math.max(corr, 0.4),
              curveness: 0.2,
            },
            emphasis: {
              lineStyle: {
                width: Math.max(corr * 10, 3),
                opacity: 1,
                curveness: 0.2,
              },
            },
          };
        }
        const grpColor =
          colorMap[network.nodes.find((n) => n.id === source).group];
        return {
          source,
          target,
          value,
          lineStyle: {
            width: 1,
            color: grpColor,
            opacity: 0.5,
            curveness: 0.1,
          },
          emphasis: {
            lineStyle: {
              width: 2,
              opacity: 1,
              curveness: 0.1,
            },
          },
        };
      });

      const option = {
        tooltip: {
          formatter: (params) => {
            if (params.dataType === "edge") {
              return `${params.data.source} ↔ ${
                params.data.target
              }: ${params.data.value.toFixed(2)}`;
            }
            return params.data.id;
          },
        },
        legend: {
          orient: "vertical",
          left: "left",
          data: [
            { name: "疾病", icon: "circle", selected: true },
            { name: "年龄段", icon: "circle" },
            { name: "性别", icon: "circle" },
            { name: "区域", icon: "circle" },
          ],
          selectedMode: "multiple",
          tooltip: { show: true },
          textStyle: {
            color: "#fff",
          },
        },
        series: [
          {
            name: "共病网络",
            type: "graph",
            layout: "circular",
            center: ["40%", "50%"],
            circular: { rotateLabel: true },
            data: nodes,
            links: links,
            categories: categories.map((c) => ({ name: c })),
            roam: true,
            zoom: 0.8,
            focusNodeAdjacency: true,
            label: {
              show: true,
              position: "right",
              fontSize: 12,
              textStyle: { color: "#fff" },
            },
            edgeSymbol: ["none", "arrow"],
            edgeSymbolSize: [0, 4],
          },
        ],
      };

      netChart.setOption(option);

      // 禁用 disease 图例按钮点击隐藏
      netChart.on("legendselectchanged", function (params) {
        if (params.name === "疾病" && !params.selected["疾病"]) {
          netChart.setOption({
            legend: {
              selected: { ...params.selected, 疾病: true },
            },
          });
        }
      });

      netObserver.observe(document.getElementById("main2"));
    })
    .catch((err) => console.error("数据加载失败:", err));
})();

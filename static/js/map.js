let mapchart;
const mapObserver = new ResizeObserver(() => {
  mapchart.resize();
});

(function () {
  let dom = document.getElementById("mapContainer");
  if (!dom) {
    return;
  }
  mapchart = echarts.init(dom);
  mapchart.showLoading();

  // 加时间戳避免缓存
  fetch("static/dataset/data3.0.json?v=" + Date.now())
    .then((res) => {
      return res.json();
    })
    .then((rawData) => {
      mapchart.hideLoading();

      // 1. 先把 data3.0.json 的带后缀名字， normalize 成短名：
      let normalized = {};
      Object.keys(rawData).forEach(function (fullName) {
        // 顺序很重要：先删“特别行政区”，再删“回族自治区”，再删“自治区”，最后删“省”“市”
        let short = fullName
          .replace(/特别行政区$/, "")
          .replace(/回族自治区$/, "")
          .replace(/壮族自治区$/, "")
          .replace(/维吾尔自治区$/, "")
          .replace(/自治区$/, "")
          .replace(/省$/, "")
          .replace(/市$/, "");
        normalized[short] = rawData[fullName];
      });

      // 2. 拿到所有 GeoJSON 注册后的省份短名
      let geo = echarts.getMap("china").geoJson;
      let provinces = geo.features.map(function (f) {
        return f.properties.name;
      });

      // 3. 构造 mapData，并算出最大值
      let mapData = [],
        maxCount = 0;
      provinces.forEach(function (prov) {
        let obj = normalized[prov] || {}; // 如果没命中，就 {}
        let sum = Object.values(obj).reduce((a, b) => a + b, 0);
        mapData.push({ name: prov, value: sum });
        if (sum > maxCount) maxCount = sum;
      });

      // 4. 真正渲染
      mapchart.setOption({
        tooltip: {
          trigger: "item",
          formatter: function (params) {
            let d = normalized[params.name] || {};
            let tpl = "<strong>" + params.name + "</strong><br/>";
            if (!Object.keys(d).length) {
              tpl += "无数据";
            } else {
              Object.keys(d).forEach(function (dis) {
                tpl += dis + "：" + d[dis] + "<br/>";
              });
            }
            return tpl;
          },
        },
        visualMap: {
          min: 0,
          max: maxCount,
          left: "left",
          bottom: "5%",
          text: ["高", "低"],
          textStyle: {
            color: "#fff",
          },
          calculable: false,
          inRange: { color: ["#e0f7ff", "#006edd"] },
        },
        series: [
          {
            name: "患者总数",
            type: "map",
            left: "center",
            top: "center",
            map: "china",
            roam: false,
            label: { show: false },
            emphasis: { label: { show: true } },
            itemStyle: {
              borderColor: "#111",
              borderWidth: 0.5,
            },
            data: mapData,
          },
        ],
      });
    })
    .catch((err) => {
      mapchart.hideLoading();
    });

  mapObserver.observe(dom);
})();

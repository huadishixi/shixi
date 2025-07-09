function predict(){
    const form = document.getElementById('predictForm');
    const formData = new FormData(form);
    const data = {};
//    formData.forEach((v,k) => data[k] = v);
    const allowNegative = "骨密度T值";
    let hasNegative = false;
    formData.forEach((v, k) => {
        const val = v.trim();
        if(parseFloat(val) < 0 && k !== allowNegative){
            hasNegative = true;
        }
        data[k] = val;
    });

    if (hasNegative) {
        alert("该数值不能为负数！");
        return;
    }

    fetch('/predict',{
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(data)
    }).then(res => res.json())
      .then(result => {
        let html = `
        <table class="table table-striped table-bordered">
              <thead>
                  <tr>
                      <th>疾病</th>
                      <th>状态</th>
                      <th>相似人群患病率</th>
                  </tr>
              </thead>
              <tbody>`;
        result.forEach(r => {
            let statusClass = r.状态 === "有风险" ? "risk" : "healthy";
            html += `<tr>
                          <td>${r.疾病}</td>
                          <td class="${statusClass}">${r.状态}</td>
                          <td>${(r.相似人群患病率 * 100).toFixed(1)}%</td>
                      </tr>`;
        });
        html += "</tbody></table>";

        //把结果放进 modal-body
        document.getElementById('result-body').innerHTML = html;

        //这里创建 modal 并显示
        const modal = new bootstrap.Modal(document.getElementById('result'));
        modal.show();
      });
}

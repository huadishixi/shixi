const diseaseToParams = {
    "高血压": ['收缩压(mmHg)', '舒张压(mmHg)', 'BMI'],
    "冠心病": ['血糖(mmol/L)', '总胆固醇(TC)', '低密度脂蛋白(LDL)', '高密度脂蛋白(HDL)'],
    "脑卒中": ['NIHSS', 'mRS', '缺血灶面积(cm²)', 'CRP(mg/L)'],
    "糖尿病": ['血糖(mmol/L)', 'BMI'],
    "骨质疏松": ['骨密度T值'],
    "老年性痴呆": ['MMSE'],
    "关节炎": ['VAS_关节炎'],
    "颈椎病": ['颈椎活动角度(°)', 'VAS_颈椎'],
    "腰椎间盘突出症": ['SLR角度(°)', 'VAS_腰椎'],
    "便秘": ['排便频率(次/周)', '睡眠质量(1-5)']
};

function renderHealthPredictUI() {
    const container = document.getElementById("healthPredictContainer");
    if (!container) {
        alert("找不到目标区域 healthPredictContainer！");
        return;
    }

    // 构建模块提示、选择器和输入表单容器
    container.innerHTML = `
        <h4 class="mb-3">健康风险预测</h4>
        <p>请选择您关心的疾病，系统将自动提示相关指标并评估健康风险：</p>
        <div id="diseaseCheckboxes" class="form-check form-check-inline mb-3"></div>
        <form id="dynamicHealthForm" class="row g-3"></form>
        <button class="btn btn-primary mt-3" onclick="submitDynamicPrediction()">提交预测</button>
        <hr>
        <div id="predictionResult" class="mt-3"></div>
    `;

    // 生成疾病多选框
    const diseaseBox = document.getElementById("diseaseCheckboxes");
    Object.keys(diseaseToParams).forEach(disease => {
        const label = document.createElement("label");
        label.className = "form-check-label me-3";
        const input = document.createElement("input");
        input.type = "checkbox";
        input.className = "form-check-input me-1";
        input.value = disease;
        input.onchange = updateHealthInputForm;
        label.appendChild(input);
        label.appendChild(document.createTextNode(disease));
        diseaseBox.appendChild(label);
    });
}

function updateHealthInputForm() {
    const checked = Array.from(document.querySelectorAll("#diseaseCheckboxes input:checked"))
                         .map(cb => cb.value);
    const params = new Set();
    checked.forEach(disease => {
        diseaseToParams[disease].forEach(param => params.add(param));
    });

    const form = document.getElementById("dynamicHealthForm");
    form.innerHTML = "";

    Array.from(params).forEach(param => {
        const div = document.createElement("div");
        div.className = "col-md-4";
        div.innerHTML = `
            <label class="form-label">${param}</label>
            <input type="number" step="0.1" name="${param}" class="form-control" value="0">
        `;
        form.appendChild(div);
    });
}

function submitDynamicPrediction() {
    const form = document.getElementById("dynamicHealthForm");
    const data = {};
    const allowNegative = "骨密度T值";
    let hasNegative = false;

    // 1. 收集表单填写值
    Array.from(form.elements).forEach(el => {
        if (el.name) {
            const val = parseFloat(el.value.trim());
            if (val < 0 && el.name !== allowNegative) {
                hasNegative = true;
            }
            data[el.name] = val;
        }
    });

    if (hasNegative) {
        alert("该数值不能为负数！");
        return;
    }

    // 2. 自动补全所有缺失的字段为 0（防止后端报错）
    const allFields = [
        '收缩压(mmHg)', '舒张压(mmHg)', '血糖(mmol/L)', '总胆固醇(TC)',
        '低密度脂蛋白(LDL)', '高密度脂蛋白(HDL)', '甘油三酯(TG)', '肌钙蛋白I(cTnI)',
        'NIHSS', 'mRS', '缺血灶面积(cm²)', 'CRP(mg/L)', 'ESR(mm/h)', 'VAS_关节炎',
        '颈椎活动角度(°)', 'VAS_颈椎', 'SLR角度(°)', 'VAS_腰椎', '骨密度T值',
        'MMSE', '排便频率(次/周)', '睡眠质量(1-5)', 'BMI'
    ];
    allFields.forEach(field => {
        if (!(field in data)) {
            data[field] = 0;
        }
    });

    // 3. 发送请求
    fetch('/predict', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(data)
    }).then(res => {
        if (!res.ok) {
            return res.text().then(text => { throw new Error(text) });
        }
        return res.json();
    })
    .then(result => {
        let html = `<table class="table table-bordered table-striped text-light">
                      <thead><tr><th>疾病</th><th>状态</th><th>相似人群患病率</th></tr></thead><tbody>`;
        result.forEach(r => {
            const statusClass = r.状态 === "有风险" ? "text-danger" : "text-success";
            html += `<tr><td>${r.疾病}</td><td class="${statusClass}">${r.状态}</td><td>${(r.相似人群患病率 * 100).toFixed(1)}%</td></tr>`;
        });
        html += "</tbody></table>";
        document.getElementById("predictionResult").innerHTML = html;
    })
    .catch(err => {
        console.error("预测出错：", err);
        alert("预测失败，请检查后端或网络连接。");
    });
}


function renderHealthPredictUI() {
    // ① 隐藏原来的内容
    const targetDiv = document.querySelector(".visual_chart_text");  // 或 document.getElementById("你的容器ID")
    if (targetDiv) {
        targetDiv.style.display = "none"; // 隐藏原有内容
    }

    // ② 显示我们自己的健康预测模块（写到 container 中）
    const container = document.getElementById("healthPredictContainer");
    container.innerHTML = `
        <h4 class="mb-3">健康风险预测</h4>
        <p>请选择您关心的疾病，系统将自动提示相关指标并评估健康风险：</p>
        <div id="diseaseCheckboxes" class="d-flex flex-wrap mb-3"></div>
        <form id="dynamicHealthForm" class="row g-3"></form>
        <button class="btn btn-primary mt-3" onclick="submitDynamicPrediction()">提交预测</button>
        <hr>
        <div id="predictionResult" class="mt-3"></div>
    `;

    // ③ 多选疾病列表
    const diseaseBox = document.getElementById("diseaseCheckboxes");
    Object.keys(diseaseToParams).forEach(disease => {
        const checkbox = document.createElement("div");
        checkbox.className = "form-check me-4";
        checkbox.innerHTML = `
            <input type="checkbox" class="form-check-input" value="${disease}" id="dis-${disease}" onchange="updateHealthInputForm()">
            <label for="dis-${disease}" class="form-check-label">${disease}</label>
        `;
        diseaseBox.appendChild(checkbox);
    });
}

function updateHealthInputForm() {
    const checked = Array.from(document.querySelectorAll("#diseaseCheckboxes input:checked"))
                         .map(cb => cb.value);
    const params = new Set();
    checked.forEach(disease => {
        diseaseToParams[disease].forEach(param => params.add(param));
    });

    const form = document.getElementById("dynamicHealthForm");
    form.innerHTML = "";

    Array.from(params).forEach(param => {
        const div = document.createElement("div");
        div.className = "col-md-4";
        div.innerHTML = `
            <label class="form-label">${param}</label>
            <input type="number" step="0.1" name="${param}" class="form-control" value="0">
        `;
        form.appendChild(div);
    });
}

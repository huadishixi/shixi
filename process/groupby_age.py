import pandas as pd
import json


def main():
    # 读取数据
    df = pd.read_csv('data3.0.csv', encoding='utf-8')

    # 定义年龄段区间和标签
    bins = [60, 65, 70, 75, 80, 85, 90, 95, 100, df['年龄'].max() + 1]
    labels = [
        '60–64岁', '65–69岁', '70–74岁', '75–79岁',
        '80–84岁', '85–89岁', '90–94岁', '95–99岁',
        '100–104岁'
    ]
    df['年龄段'] = pd.cut(df['年龄'], bins=bins, labels=labels, right=False)

    # 定义疾病列表
    diseases = [
        '高血压', '糖尿病', '冠心病', '脑卒中',
        '骨质疏松', '老年性痴呆', '关节炎', '颈椎病',
        '腰椎间盘突出症', '便秘'
    ]

    # 统计每个年龄段的总人数
    total_by_age = {
        label: int(df[df['年龄段'] == label].shape[0])
        for label in labels
    }

    # 统计每种疾病在各年龄段的分布及占比
    disease_distribution = {}
    for d in diseases:
        dist = {}
        for label in labels:
            count = int(df[(df[d] == 1) & (df['年龄段'] == label)].shape[0])
            total = total_by_age[label]
            # 占比：相对于该年龄段总人数
            percentage = round((count / total * 100) if total > 0 else 0, 2)
            dist[label] = {
                'count': count,
                'percentage': percentage
            }
        disease_distribution[d] = dist

    # 汇总结果
    result = {
        'total_by_age': total_by_age,
        'disease_distribution': disease_distribution
    }

    # 输出为 JSON 文件
    out_file = 'elderly_health_dataset_with_BMI.json'
    with open(out_file, 'w', encoding='utf-8') as f:
        json.dump(result, f, ensure_ascii=False, indent=2)

    print(f"已将分布结果保存到 {out_file}")


if __name__ == '__main__':
    main()

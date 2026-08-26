---
title: Dijkstra 不是最短路的全部答案
date: 2026-07-27
category: 算法基础
tags:
  - C++
  - 图论
  - 算法基础
description: 当边出现负权、图变得稠密，算法选择也要跟着问题改变。
excerpt: 算法名称不是答案本身，真正重要的是确认问题满足哪些前提。
---

Dijkstra 适用于所有边权非负的图。每次从未确定的节点中取出当前距离最小者，并把它的邻边松弛。

如果存在负权边，这个“取出后就不会更优”的前提不再成立。此时可以考虑 Bellman-Ford；如果图是无权图，BFS 往往更直接；如果需要处理多个源点，也可以加入超级源点统一计算。

~~~cpp
while (!pq.empty()) {
    auto [distance, node] = pq.top();
    pq.pop();
    if (distance != dist[node]) continue;
    for (auto [next, weight] : graph[node]) {
        if (dist[next] > distance + weight) {
            dist[next] = distance + weight;
            pq.push({dist[next], next});
        }
    }
}
~~~

先写清楚约束，再选择算法，通常比直接套用熟悉的模板更可靠。

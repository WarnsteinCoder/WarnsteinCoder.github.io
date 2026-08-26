---
title: Transformer 的注意力到底在计算什么
date: 2026-08-11
category: 大模型
tags:
  - Python
  - Transformer
  - 大模型
description: 不从公式背诵开始，尝试用矩阵形状和一个最小例子重新走一遍。
excerpt: 注意力机制可以被拆成几次线性变换、一次相似度计算和一个归一化步骤。
---

注意力机制的输入是一个包含多个 token 表示的矩阵 $X \in \mathbb{R}^{n \times d}$。通过三个不同的参数矩阵得到：

$$
Q = XW_Q,\quad K = XW_K,\quad V = XW_V
$$

随后计算每个 token 对其他 token 的关注程度：

$$
\operatorname{Attention}(Q,K,V) = \operatorname{softmax}\left(\frac{QK^\top}{\sqrt{d_k}}\right)V
$$

这里最值得观察的不是公式本身，而是形状。$QK^\top$ 的形状是 $n \times n$，它表达的是 token 两两之间的关系；乘上 $V$ 后，每个位置得到一个融合上下文的新表示。

~~~python
import numpy as np

scores = query @ key.T / np.sqrt(key.shape[-1])
weights = np.exp(scores) / np.exp(scores).sum(axis=-1, keepdims=True)
output = weights @ value
~~~

当矩阵形状和数据流都能在纸上走通时，注意力就不再只是一个需要记忆的黑盒。

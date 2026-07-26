#import "/content/book.typ": book
#show: book.with(title: "crypto_lab3")

= CTF101 CRYPTO Lab3
<ctf101-crypto-lab3>
== 3240102120
<section>
=== Task1 (EZHNP)
<task1-ezhnp>
题目给了一个.sage文件，实际就是sage环境下的python。看了一下内容，前面是创建了一个在Fp上的椭圆曲线y#super[2=x]3+7，然后指定了一个点G。后面开始签名，签名18次给出18次的结果。

签名函数大致看了一下，做了什么这里不细说，为了不那么乱重新写了一下同构，大致推出了这么个式子：、

#figure(image("image-65.png", alt: "alt text"),
  caption: [
    alt text
  ]
)

#figure(image("image-66.png", alt: "alt text"),
  caption: [
    alt text
  ]
)

也就是说，每次签名取的随机240bit质数k乘每组已知的s，是每组已知的r乘FLAG加H再模n得到的结果。这个等式里面FLAG和k都不知道。

写一下线性同余方程组：
\$\$ r\\\_i \\\\cdot Flag - s\\\_i \\\\cdot k\\\_i \\\\equiv -h \\\\pmod n \$\$
很容易把这个方程组转化成一个格问题，然后用LLL求SVP。

因为 \$ s\_i \$ 是通过 \$ k\_i^-1 \$
生成的，所以有模逆，转化一下刚才的式子就能得到：
\$\$ k\\\_i \\\\equiv (s\\\_i^{-1} r\\\_i) \\\\cdot Flag + (s\\\_i^{-1} h) \\\\pmod n \$\$

这个式子变得舒爽很多，因为只有 \$ k\_i \$ 和 \$ Flag \$
被拿出来了，其他的都是他们的系数。换元法设
\$\$ u\\\_i = s\\\_i^{-1} r\\\_i \\\\pmod n \\newline v\\\_i = s\\\_i^{-1} h \\\\pmod n \$\$
于是有了 \$ k\_i \\equiv u\_i \\cdot Flag + v\_i \\pmod n \$

这就完全转化成了上课时讲的HNP问题了，先写成矩阵形式： \$\$
L = \\begin{pmatrix}
n & 0 & 0 & \\cdots & 0 & 0 & 0 \\newline
0 & n & 0 & \\cdots & 0 & 0 & 0 \\newline
0 & 0 & n & \\cdots & 0 & 0 & 0 \\newline
\\vdots & \\vdots & \\vdots & \\ddots & \\vdots & \\vdots & \\vdots \\newline
0 & 0 & 0 & \\cdots & n & 0 & 0 \\newline
u\_1 & u\_2 & u\_3 & \\cdots & u\_{18} & C\_1 & 0 \\newline
v\_1 & v\_2 & v\_3 & \\cdots & v\_{18} & 0 & C\_2
\\end{pmatrix}
\$\$

再构造C1和C2进行LLL即可。以下是脚本：

```sage
from Crypto.Util.number import *
knownH=0x2cd65ef85a047849c1c7a668a3e4ce63cabd627c467dd90f50f6412a2adb5b6e #明文信息sha256的bytestolong
knownN=0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEBAAEDCE6AF48A03BBFD25E8CD0364141
R = ...
S = ...

U,V=[],[]
for r,s in zip(R,S):
    U.append(pow(s,-1,knownN)*r%knownN)
    V.append(pow(s,-1,knownN)*knownH%knownN)

p = knownN
rs = [-i for i in U]
cs = V
t = len(rs)
kbits = 240
K = 2 ** kbits

U,V=[],[]
for r,s in zip(R,S):
    U.append(pow(s,-1,knownN)*r%knownN)
    V.append(pow(s,-1,knownN)*knownH%knownN)

K = 2^240
TBL = identity_matrix(18) * knownN
L = matrix([U, V])
KL = matrix([[K / knownN, 0], [0, K]])
M = block_matrix([[TBL, 0], [L, KL]])
svp = M.LLL()
x = svp[1, -2] / K * knownN % knownN
print(long_to_bytes(x))
```

得到flag：`AAA{DSA_c4n_b4_Att4ck_by_HNP}`

=== Task2 (CopperSmith)
<task2-coppersmith>
这道题拿到有点似曾相识，这不是Lab2的RSA吗（？）

整理一下已知信息：len(flag)==60，N已知，用p和q分别做e的两个c已知。

根据Coppersmith引理中RSA部分：

#figure(image("image-67.png", alt: "alt text"),
  caption: [
    alt text
  ]
)

本题中p和q大致相近，\$ p N^{} \$ 成立，可以使用Coppersmith进行

根据关系，已知 $ \(m - c_1\)\(m - c_2\)equiv 0 med\(mod med N\) $
于是我们设 \$\$ c\_1+c\_2 = u \\newline
c\_1\\cdot c\_2 = v \$\$ 可以得到一个多项式
$ f\(x\)= x^2 - s x + v med\(mod med N\) $ 其中 \$ m \$
是该多项式的一个根。Sagemath内置了small\_roots，因此可以直接使用。写出如下脚本：

```sage
N=...
c1=...
c2=...
P.<x> = PolynomialRing(Zmod(N))
A = -(c1 + c2)
B = c1 * c2
poly = x^2 + A*x + B
X = 2^480
d = poly.degree()
roots = poly.small_roots(X=X, d=d, epsilon=1/20)
if roots:
    m = int(roots[0])
    print(long_to_bytes(m))
```

运行得到结果：

#figure(image("image-68.png", alt: "alt text"),
  caption: [
    alt text
  ]
)

即flag: `AAA{Ccccccooooo0pp3rsm1th_14_v3ry_1mp0rt4nttttt}`

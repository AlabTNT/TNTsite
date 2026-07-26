#import "/content/book.typ": book
#show: book.with(title: "crypto_lab2")

= CTF101 Crypto Lab2
<ctf101-crypto-lab2>
== 3240102120
<section>
=== Task1 (RSA)
<task1-rsa>
#strong[这里选择EndlessRSA1]

上来先两次nc试试水，每次计算内容都不一样。既然只包含digit和letter，那就是(26+26+10)^4种遍历。写个小脚本硬跑一下。不过因为题目是Endless，感觉后面应该会有114514道题等着我……

#figure(image("image-58.png", alt: "alt text"),
  caption: [
    alt text
  ]
)

脚本：

```python
from pwn import *
import hashlib
import itertools
import re

charset=r'QWERTYUIOPASDFGHJKLZXCVBNMqwertyuiopasdfghjklzxcvbnm1234567890'

def solve_pow(qianmian, target):
    for c in itertools.product(charset, repeat=4):
        prefix = ''.join(c)
        test=prefix + qianmian
        h=hashlib.sha256(test.encode()).hexdigest()
        if h==target:
            return prefix

io=remote('10.214.160.13',12501)

question=io.recvline().decode().strip()

match=re.search(r"sha256\(XXXX \+ '(\w+)'\)\.hexdigest\(\) == (\w+)", question)
qianmian=match.group(1)
target=match.group(2)

io.sendline(solve_pow(qianmian, target))
io.interactive()
```

果不其然，跑完之后就看到了这种东西，那估计是要写一堆了：

#figure(image("image-59.png", alt: "alt text"),
  caption: [
    alt text
  ]
)

第0关：

```python
def level0(n,e,c,p,q):
    varphi=(p-1)*(q-1)
    d=pow(e, -1, varphi)
    m=pow(c,d,n)
    return hex(m)[2:].encode()

io.recvuntil(b"====== Level  0 ======\n")
_=[]
for i in range(5):
    _.append(io.recvline().decode().strip())
for i in range(5):
    _[i]=int(_[i].split("= 0x")[1].strip(),16)

io.recvuntil(b"@@@ m =")
io.sendline(level0(_[0], _[1], _[2], _[3], _[4]))
io.interactive()
```

然后是第一关，少了p和q。问题不大

#figure(image("image-60.png", alt: "alt text"),
  caption: [
    alt text
  ]
)

直接上yafu，顺便稍微整理一下脚本：

```python
from pwn import *
import hashlib
import itertools
import re

io=remote('10.214.160.13',12501)


#! POW?

def spow(qianmian, target):
    CHARSET=r'QWERTYUIOPASDFGHJKLZXCVBNMqwertyuiopasdfghjklzxcvbnm1234567890'
    for c in itertools.product(CHARSET, repeat=4):
        prefix=''.join(c)
        test=prefix + qianmian
        h=hashlib.sha256(test.encode()).hexdigest()
        if h == target:
            return prefix.encode()

question=io.recvline().decode().strip()
match=re.search(r"sha256\(XXXX \+ '(\w+)'\)\.hexdigest\(\) == (\w+)", question)
qianmian=match.group(1)
target=match.group(2)
io.sendline(spow(qianmian, target))

#! LEVEL0

def level0(n,e,c,p,q):
    varphi=(p-1)*(q-1)
    d=pow(e, -1, varphi)
    m=pow(c,d,n)
    return hex(m)[2:].encode()

io.recvuntil(b"====== Level  0 ======\n")
_=[]
for i in range(5):
    _.append(io.recvline().decode().strip())
    _[i]=int(_[i].split("= 0x")[1].strip(),16)

io.recvuntil(b"@@@ m =")
io.sendline(level0(_[0], _[1], _[2], _[3], _[4]))

#! LEVEL1

def level1(n,e,c):
    import subprocess
    cmd=["/mnt/d/ctf/yafu/yafu", f"factor({n})"]
    result=subprocess.run(cmd, capture_output=True, text=True)
    output=result.stdout
    for line in output.splitlines():
        if line.startswith('P'):
            factor=int(line.split('=')[1].strip())
            if n%factor == 0:
                p=factor
                q=n//factor
    return level0(n,e,c,p,q)
    

io.recvuntil(b"====== Level  1 ======\n")
_=[]
for i in range(3):
    _.append(io.recvline().decode().strip())
    _[i]=int(_[i].split("= 0x")[1].strip(),16)

io.recvuntil(b"@@@ m =")
io.sendline(level1(_[0], _[1], _[2]))

#! END
io.interactive()
```

然后是level2

#figure(image("image-61.png", alt: "alt text"),
  caption: [
    alt text
  ]
)

```python
...
#! LEVEL2

def level2(n,e1,e2,c1,c2):
    def extended_gcd(a,b):
        if b==0:
            return (1,0)
        else:
            x1,y1=extended_gcd(b,a%b)
            x,y=y1,x1-(a//b)*y1
            return (x,y)
    s1,s2=extended_gcd(e1, e2)

    if s1<0:
        c1=pow(c1, -1, n)
        s1=-s1
    if s2<0:
        c2=pow(c2, -1, n)
        s2=-s2

    return hex((pow(c1,s1,n)*pow(c2,s2,n))%n)[2:].encode()

io.recvuntil(b"====== Level  2 ======\n")
_=[]
for i in range(5):
    _.append(io.recvline().decode().strip())
    _[i]=int(_[i].split("= 0x")[1].strip(),16)

io.recvuntil(b"@@@ m =")
io.sendline(level2(_[0], _[1], _[2], _[3], _[4]))
```

继续：level3和leve1是差不多的，区别在于数大了不少，因为e过大所以可以采用W攻击：

#figure(image("image-62.png", alt: "alt text"),
  caption: [
    alt text
  ]
)

根据RSA原理可知，由于n很大，所以对应的p和q一定也很大。这样，$ phi\(n\)= p q -\(p + q\)+ 1 approx p q = n $。又
\$\$ ed \\equiv 1 mod \\varphi(n) \\newline ed-1=k\\varphi(n) \\newline \\frac{ed-1}{d\\varphi(n)} = \\frac{k\\varphi(n)}{d\\varphi(n)} \\newline \\frac{e}{\\varphi(n)}-\\frac{k}{d} = \\frac{1}{d\\varphi(n)} \$\$
这里 \$ d\(n) \$ 非常大，而 \$ \(n) n \$，故 \$ \$。

由于e很大，所以可以连分数展开，再对每一项求渐进分数，就能得到kd，代入式子就得到了varphi(n)，之后就能正常求解

```python
#! LEVEL3

def level3(n, e, c):
    def lfs(e, n):
        while n:
            q=e//n
            yield q
            e,n=n,e-q*n

    def zkk(cf):
        n0,d0=1,0
        n1,d1=cf[0],1
        yield n1,d1
        for q in cf[1:]:
            n2=q*n1+n0
            d2=q*d1+d0
            yield n2,d2
            n0,d0=n1,d1
            n1,d1=n2,d2

    cf = list(lfs(e,n))
    for k,d in zkk(cf):
        if k == 0:
            continue
        varphi = (e * d - 1) // k
        b = n - varphi + 1
        discr = b * b - 4 * n
        if discr >= 0:
            #sqrt_d=(discr**0.5) #这里之前爆过overflow
            from math import isqrt
            sqrt_d = isqrt(discr)
            if sqrt_d * sqrt_d == discr:
                m = pow(c,d,n)
                return hex(m)[2:].encode()


io.recvuntil(b"====== Level  3 ======\n")
_=[]
for i in range(3):
    _.append(io.recvline().decode().strip())
    _[i]=int(_[i].split("= 0x")[1].strip(),16)
io.recvuntil(b"@@@ m =")
io.sendline(level3(_[0], _[1], _[2]))
print("level3:",io.recvline().decode().strip())
```

来到level4。丢了我一大坨：n1,n2,n3,e,c1,c2,c3，但是e给的非常小只有3。可以直接想到低指数攻击，根据中国剩余定理拼出m：

```python
#! LEVEL4

def level4(n1,n2,n3,e,c1,c2,c3):
    from sympy.ntheory.modular import crt
    from gmpy2 import iroot
    c,_=crt([n1, n2, n3], [c1, c2, c3])
    c=int(c)
    m=iroot(c,e)[0]
    return hex(m)[2:].encode()

io.recvuntil(b"====== Level  4 ======\n")
_=[]
for i in range(7):
    _.append(io.recvline().decode().strip())
    _[i]=int(_[i].split("= 0x")[1].strip(),16)
io.recvuntil(b"@@@ m =")
io.sendline(level4(_[0], _[1], _[2], _[3], _[4], _[5], _[6]))
print("level4:", io.recvline().decode().strip())
```

调试过程中出现了一个插曲，比较让人红温，就是这个程序只能在aTrust或者真校网（指在校园区域内连接ZJUWLAN）环境下才能运行成功进入level5，用zjuconnect就会炸。不过还是顺利进入level5了。

level5给了n和npnq，其中npnq是p和q的下一个质数的乘积。那么有一个攻击法是p和q相差较小时，可以根据(p-q)^2/4接近sqrt(n)的性质来分解n\*npnq，因为n\*npnq=p\*q\*np\*nq=(p\*nq)\*(q\*np)，而两式比较接近。可以直接搬oier写好的rsa攻击算法。不过因为分解之后的因子不是质数，有可能分解出p\*q，所以要要求分解两次，在两次中找到相乘为n的那一次。

```python
def level5(n,npnq,e,c):
    def fematFactorization(n) -> list:
        from gmpy2 import iroot, is_square
        from itertools import count

        flist = []
        a = iroot(n, 2)[0]
        b_2 = a**2 - n
        for a in count(a):
            b_2 = a**2 - n
            if b_2 < 0:
                continue
            b = iroot(b_2, 2)[0]
            if a ** 2 - b ** 2 == n:
                flist.append((a-b, a+b))
            if len(flist) == 2:
                return flist
    from math import gcd
    flist = fematFactorization(n * npnq)
    for p1, q1 in flist:
        if p1 * q1 == n * npnq:
            p, q = gcd(p1, n), gcd(q1, n)
            if p*q==n:
                return level0(n, e, c, p, q)
io.recvuntil(b"====== Level  5 ======\n")
_=[]
for i in range(4):
    _.append(io.recvline().decode().strip())
    _[i]=int(_[i].split("= 0x")[1].strip(),16)
io.recvuntil(b"@@@ m =")
io.sendline(level5(_[0], _[1], _[2], _[3]))
print("level5:", io.recvline().decode().strip())
```

进入第六关。第六关也是只给了nec，但是额外给了一个条件是q的计算方式。按理说也应该分在不当分解里。因为q的生成方式固定，那么可以直接列n=p\*(2019\*p+d)，因此2019
p^2 + dp - n =
0这个二次方程可列解。p是正数因此选择大解。这里需要遍历一下小数d，大概从2遍历到1000就差不多，每次步长为2。

```python
def level6(n,e,c):
    for i in range(2,1000,2):
        delta=i**2+8076*n
        if delta < 0:
            continue
        from gmpy2 import is_square, isqrt
        if is_square(delta):
            sqrt_delta=isqrt(delta)
            p=(sqrt_delta-i)//4038
            q=n//p
            return level0(n, e, c, p, q)

io.recvuntil(b"====== Level  6 ======\n")
_=[]
for i in range(3):
    _.append(io.recvline().decode().strip())
    _[i]=int(_[i].split("= 0x")[1].strip(),16)
io.recvuntil(b"@@@ m =")
io.sendline(level6(_[0], _[1], _[2]))
print("level6:", io.recvline().decode().strip())
```

终于是获得了flag。`Well done! Here is the flag: AAA{3ndl3$$_rs4_end1e55_expl01t|7aedfd0f}`

本题的完整程序于附件的endlessrsa\_1.py中。在校网环境下运行该.py文件将自动输出flag。其中为了缩短每次的调试时间把Level1的调用yafu破解改成了直接指定p和q，脚本在本报告中已贴出。

=== Task2 (RSA)
<task2-rsa>
这里注册平台还要做题，有点意思，不过是个很简单的凯撒，遍历一下就能找到单词

#figure(image("image-63.png", alt: "alt text"),
  caption: [
    alt text
  ]
)

==== Crossed Wires
<crossed-wires>
题目描述他的好基友们都在用自己的key加密文本，给了一个txt和一个python。看一下脚本内容，所有的加密基于共n，已知每个人加密时用的各自的e，然后连续加密五次。

因为是共n的，所以操作的模n是不变的，varphi(n)也是公共的，唯一变的是公钥因子e，每次都是取e次方再模n，那么只要想办法找到对应的d就能依次解密。而d是取e关于varphi(n)的模逆，这样只要能获得varphi(n)，对每一个e取模逆就可以了。而显然我们已经知道了一组没有用到的e和d，是"我的"。靠这个来尝试反推其他的d即可。

```python
... #省略已知的N、es=[...]、e、d、c赋值
temp=e*d-1
for i in range(1, 1000000):
    if temp % i == 0:
        phi = temp // i
        if (e * d) % phi == 1:
            break

ds=[]
for i in range(len(es)):
    ds.append(pow(es[i], -1, phi))
m = c
for di in reversed(ds):
    m = pow(m, di, N)
from Crypto.Util.number import long_to_bytes
print(long_to_bytes(m).decode('utf-8'))
```

可以直接拿到flag：`crypto{3ncrypt_y0ur_s3cr3t_w1th_y0ur_fr1end5_publ1c_k3y}`

==== Everything is Still Big
<everything-is-still-big>
题目在开玩笑介绍东西，直接看脚本。这个题的e和d的生成方向是反的，先随机寻找d，保证d和phi互质且81d^4比N大，之后根据d计算e。

从生成上看d是一个比较大的数，相对应的e也不会太小。但是e不小就能导致一个事情就是可以使用W攻击。引用Task1的Level3脚本完成本题：

```python
def level3(n, e, c):
    def lfs(e, n):
        while n:
            q=e//n
            yield q
            e,n=n,e-q*n

    def zkk(cf):
        n0,d0=1,0
        n1,d1=cf[0],1
        yield n1,d1
        for q in cf[1:]:
            n2=q*n1+n0
            d2=q*d1+d0
            yield n2,d2
            n0,d0=n1,d1
            n1,d1=n2,d2

    cf = list(lfs(e,n))
    for k,d in zkk(cf):
        if k == 0:
            continue
        varphi = (e * d - 1) // k
        b = n - varphi + 1
        discr = b * b - 4 * n
        if discr >= 0:
            #sqrt_d=(discr**0.5) #这里之前爆过overflow
            from math import isqrt
            sqrt_d = isqrt(discr)
            if sqrt_d * sqrt_d == discr:
                m = pow(c,d,n)
                return m
... #省略赋值
from Crypto.Util.number import long_to_bytes
print(long_to_bytes(level3(N, e, c)).decode('utf-8'))
```

运行即获得flag`crypto{bon3h5_4tt4ck_i5_sr0ng3r_th4n_w13n3r5}`

==== Endless Emails
<endless-emails>
题目描述John要回复重复邮件。看下脚本，能一眼看到e=3，同样低指数攻击可以引用Task1的Level4。而根据题目是回复重复邮件，那么用其中三个尝试解密。

但是非常遗憾解出来的一堆没法decode，所以应该不能用这种方法解。再看一下各个n的gcd发现互相都是1，代表所有n都互质。那么每一次选择的p和q都不同。尝试用小公钥爆k攻击，但是都失败了，所以还是要考虑怎么用低指数广播攻击。考虑到Level4有3组，那这个会不会是其中某三组可以解？于是修改一下脚本用组合遍历，发现确实是其中三组可解。

```python
...#省略n1~c7赋值

from itertools import combinations
from gmpy2 import iroot
from sympy.ntheory.modular import crt

def endlessemail(ns,cs):
    m_exp = crt(ns,cs)[0]
    root,exact = iroot(m_exp,3)
    if exact:
        return root
    return None

ns = [n1,n2,n3,n4,n5,n6,n7]
cs = [c1,c2,c3,c4,c5,c6,c7]

pns=[str(i)[-4:] for i in ns]

from Crypto.Util.number import long_to_bytes
for combo in combinations(zip(ns,cs),3):
    m = endlessemail([x[0] for x in combo],[x[1] for x in combo])
    if m:
        print(long_to_bytes(m).decode('utf-8'))
        print("Combo:", [pns.index(str(x[0])[-4:]) for x in combo])
```

这三组是\[0,2,5\]，也就是n1,n3,n6。得到flag内容：

```plaintext
yes

---

Johan Hastad
Professor in Computer Science in the Theoretical Computer Science
Group at the School of Computer Science and Communication at KTH Royal Institute of Technology in Stockholm, Sweden.

crypto{1f_y0u_d0nt_p4d_y0u_4r3_Vuln3rabl3}
Combo: [0, 2, 5]
```

=== Task3 (DLP)
<task3-dlp>
题目问pohlig hellman
algorithm，上网搜索一下知道是离散对数问题，暂且按下不看，先看脚本。

首先得到一个c，获得方式是给定p，找随机一个质数x，取3的x次方模p。然后取了一个新aes加密，key是用x的md5取的。再用这个aes加密了flag。其中pad函数是为了把指定内容（flag）长度填充为指定数（16）的倍数，填充单位是。给定了c和ct。

那么思路就很明了了，要求flag明文就要获得aes密码，而x是生成aes密码的重要条件，所以我们要获得x，而x唯一条件是给定的c，再看离散对数问题里面恰好满足这个形式，所以可以用c来解出x，进而解出aes加密内容。

先用factordb分解p-1：

#figure(image("image-64.png", alt: "alt text"),
  caption: [
    alt text
  ]
)

可以得到两个Q，一个是`2^518`，一个是`1119326809698249181662206673457`。这里有一个31位（十进制）大素数，理论上来说时间复杂度非常高，所以传统的方法可以解但是就和爆破没啥太大区别了。

诶但是#strong[注意到]其中的一个数是2#super[518，而x是一个500bit的质数，也就是说x比2]500小，那么x\_1模2^518之后就是x\_1本身，所以这个x\_1直接就是x自己。那么很容易就能写出代码：

```python
from Crypto.Cipher import AES
from hashlib import md5

p=960494008017250155494739990397196249930200062145145133132556398221074529657304218221253517153928380265486339083177542201148993799925721673833333778621388110957986908045712612233794551809
g=3
c=505527904713564983625416248872210831215228354175257237841602581321675204643681129570897695080321118656513647239718859773976453054734892142640867733520305568808093022238369199760987416665
ct=b'qBS\x84\xfc"\xee$\xb2d\xba\xeb\x00\xf7\xf4\xa4\x91\x90<N\x1a\xb0\xa5>\xdc^\xe3I\xc3\xecc\x1e'

gp=pow(g,(p-1)//2,p)
x=0
for k in range(518): #爆k
    hk=(c * pow(g,-x,p)) % p
    exp=(p-1) // (2 ** (k + 1))
    hp=pow(hk,exp,p)
    ck=-1
    for j in range(2):
        if pow(gp,j,p)==hp:
            ck=j
            break
    x += ck*(2**k)

print("x",x)
key=md5(str(x).encode()).digest()
print(key.hex())
cipher=AES.new(key,AES.MODE_ECB)
flag=cipher.decrypt(ct)
print(flag)
```

得到输出：

```plaintext
x 2053894483015087030685701854767453356278325084555102793864831897315754303045749675379160941341150150583621237979517947578356750335158236841357968942269
68f487751f3e05c8637e21e0ed23296f
b'AAA{W31c0m3_T0_CT4_lo1_c0urs3!}\x00'
```

提交得到flag。

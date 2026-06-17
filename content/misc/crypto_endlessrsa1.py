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
print("pow:", io.recvline().decode().strip())

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
print("level0:",io.recvline().decode().strip())

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
            else:
                raise ValueError("Factorization failed")
    return level0(n,e,c,p,q)
    

io.recvuntil(b"====== Level  1 ======\n")
_=[]
for i in range(3):
    _.append(io.recvline().decode().strip())
    _[i]=int(_[i].split("= 0x")[1].strip(),16)

io.recvuntil(b"@@@ m =")
io.sendline(level1(_[0], _[1], _[2]))
print("level1:",io.recvline().decode().strip())

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
print("level2:", io.recvline().decode().strip())

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

#! LEVEL5

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

#! LEVEL6

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

#! END
io.interactive()

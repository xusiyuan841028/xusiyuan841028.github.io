
如此设计的原因和类型演算原理有关, 首先我们看类型`(...args: string[]) => Super` 和 `(...args: string) => Sub`, 假设`Sub`是`Super`的子类型, 即`Sub extends Super`, 那么这两个函数类型, 谁是子类型,
谁是父类型?

```typescript
interface Super { a: string }
interface Sub extends Super { b: string}
type F1 = (...args: string) => Super;
type F2 = (...args: string) => Sub;
type True = F2 extends F1 ? true : false; // true
declare let f1: F1;
declare let f2: F2;
f1 = f2;
```

通过以上代码的测试, 我们发现F2是F1的子类型

然后我们再看类型`(...args: Super[]) => string` 和 `(...args: Sub[]) => string`, 这两个函数类型, 谁是子类型, 谁是父类型?

```typescript
interface Super { a: string }
interface Sub extends Super {}
type F1 = (...args: Super) => string;
type F2 = (...args: Sub) => string;
type True1 = F1 extends F2 ? true : false; // true
type True2 = F2 extends F1 ? true : false; // true
declare let f1: F1;
declare let f2: F2;
f2 = f1;
f1 = f2;
```

神奇的一幕出现了, F1既是F2的子类型, F2也是F1的子类型, 也就是说F1和F2完全兼容... 其实这是TypeScript对函数类型设计的一种宽松处理; 在类型理论中, 有Covariance(协变)和contravariance(逆变)的概念: 

如果 A ≦ B, 即A是B的子类型, 那么:
* 协变: f(A) ≦ f(B), 
* 逆变: f(B) ≦ f(A)

通常, 函数类型对输入类型(参数类型)是逆变的而对输出类型(返回类型)是协变, 而TypeScript中的函数类型对输入类型既是逆变又是协变, 这实际上是不安全的

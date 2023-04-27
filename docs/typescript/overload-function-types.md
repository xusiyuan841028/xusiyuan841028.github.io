---
outline: [2, 3]
---

# TypeScript中的重载函数类型 

---------------------------------------

<a href="https://www.typescriptlang.org/docs/handbook/release-notes/typescript-5-0.html" alt="TypeScript">
  <img src="https://img.shields.io/badge/TypeScript-v5.0.4-blue?style=for-the-badge&logo=typescript" /></a>

---------------------------------------

我们定义一个简单的重载函数:

```typescript
function fn(): void;
function fn(a: string): string;
function fn(a: number): number;
function fn(a: string, b: number): [string, number];
function fn(a?: string | number, b?: number): string | number | [string, number] | void {
  if (a !== undefined && b !== undefined) {
    return [a.toString(), b];
  }
  if (a !== undefined) {
    return a;
  }
  return;
}
```

然后尝试获取函数的参数类型:

```typescript
type ParametersFn = Parameters<typeof fn>
type ReturnTypeFn = ReturnType<typeof fn>
```

此时我们发现, 只有最后一个overload签名的参数类型和返回值类型被返回了...  

<p>
  <img src="/image/Screenshot20230419-1.png" alt="" style="border-radius:8px; border: 2px solid var(--vp-button-brand-border);">
</p>

那我们到底如何才能正确获取重载函数的所有参数类型和返回值类型呢?

首先, 我们来研究一下如何正确的定义一个重载函数类型, 参考TypeScript handbook中的[Call Signatures](https://www.typescriptlang.org/docs/handbook/2/functions.html#call-signatures),
我们很容易写出上面的重载函数的类型:

```typescript
interface OverloadFn {
  (): void;
  (a: string): string;
  (a: number): number;
  (a: string, b: number): [string, number];
}
```

<p>
  <img src="/image/Screenshot20230420-1.png" alt="" style="border-radius:8px; border: 2px solid var(--vp-button-brand-border);">
</p>

接着, 试着写出一个`OverloadReturnType<T>`来获取返回值类型, 但是问题在于overload签名的数量不是固定的, 如何来进行定义呢? 这里只能采用一个折中的写法, 以下写法最多可以支持8个函数重载签名:

```typescript
type OverloadedReturnType<T> = 
  T extends { (...args: any[]) : infer R; (...args: any[]) : infer R; (...args: any[]) : infer R ; (...args: any[]) : infer R; (...args: any[]) : infer R; (...args: any[]) : infer R; (...args: any[]) : infer R; (...args: any[]) : infer R } ? R  :
  T extends { (...args: any[]) : infer R; (...args: any[]) : infer R; (...args: any[]) : infer R ; (...args: any[]) : infer R; (...args: any[]) : infer R; (...args: any[]) : infer R; (...args: any[]) : infer R } ? R :
  T extends { (...args: any[]) : infer R; (...args: any[]) : infer R; (...args: any[]) : infer R ; (...args: any[]) : infer R; (...args: any[]) : infer R; (...args: any[]) : infer R } ? R :
  T extends { (...args: any[]) : infer R; (...args: any[]) : infer R; (...args: any[]) : infer R ; (...args: any[]) : infer R; (...args: any[]) : infer R } ? R :
  T extends { (...args: any[]) : infer R; (...args: any[]) : infer R; (...args: any[]) : infer R ; (...args: any[]) : infer R } ? R :
  T extends { (...args: any[]) : infer R; (...args: any[]) : infer R; (...args: any[]) : infer R } ? R  :
  T extends { (...args: any[]) : infer R; (...args: any[]) : infer R } ? R :
  T extends { (...args: any[]) : infer R; } ? R : any;
```

我们尝试着使用一下, 结果非常完美!

<p>
  <img src="/image/Screenshot20230420-2.png" alt="" style="border-radius:8px; border: 2px solid var(--vp-button-brand-border);">
</p>

接下来, 大家信心满满的写出了`OverloadParameters<T>`, 想着今天终于可以不用加班了, 然而 ...

```typescript
type OverloadedParameters<T> = 
  T extends { (...args: infer P) : any; (...args: infer P) : any; (...args: infer P) : any ; (...args: infer P) : any; (...args: infer P) : any; (...args: infer P) : any; (...args: infer P) : any; (...args: infer P) : any } ? P :
  T extends { (...args: infer P) : any; (...args: infer P) : any; (...args: infer P) : any ; (...args: infer P) : any; (...args: infer P) : any; (...args: infer P) : any; (...args: infer P) : any } ? P :
  T extends { (...args: infer P) : any; (...args: infer P) : any; (...args: infer P) : any ; (...args: infer P) : any; (...args: infer P) : any; (...args: infer P) : any } ? P :
  T extends { (...args: infer P) : any; (...args: infer P) : any; (...args: infer P) : any ; (...args: infer P) : any; (...args: infer P) : any } ? P :
  T extends { (...args: infer P) : any; (...args: infer P) : any; (...args: infer P) : any ; (...args: infer P) : any } ? P :
  T extends { (...args: infer P) : any; (...args: infer P) : any; (...args: infer P) : any } ? P :
  T extends { (...args: infer P) : any; (...args: infer P) : any } ? P :
  T extends { (...args: infer P) : any; } ? P : any;

type OverloadParameters = OverloadedParameters<typeof fn>;
```

<p>
  <img src="/image/Screenshot20230420-3.png" alt="" style="border-radius:8px; border: 2px solid var(--vp-badge-danger-border);">
</p>
<br/>

查阅TypeScrpit相关源码和Issues后发现, 条件类型中`infer`关键字后面推导的类型, 通常是做Union连接, 例如`return type`, `parameter type`, `type parameter`以及`union type`中出现的类型:

```typescript
type ItemType<T> = T extends Array<infer I> ? I : T;
type Item = ItemType<string | number[] | boolean[]>;

type ReturnTypes<T> = T extends { get(): infer G; pop(): infer G; } ? G : never;
type Return = ReturnTypes<{ get(): string; pop(): number}>;
```

<p>
  <img src="/image/Screenshot20230424-1.png" alt="" style="border-radius:8px; border: 2px solid var(--vp-button-brand-border);">
</p>

<br/>

但`infer`右值类型是重载函数的`parameter type`时, 却是采用`intersection type`, 所以`OverloadedParameters<T>`得到的结果是`void & string & number & [string, number]`

```typescript
type ParameterTypes<T> = T extends { set(a: infer P): any; push(b: infer P): ; } ? P : any;
type Params = ParameterTypes<{ set(a: string): any; push(b: number): any}>;
```

毫无疑问, 交集类型的结果是`never`, 因为不存在一个类型同时是`void` `string` `number` 和 `[string, number]`的子集 (参考[NonNullable源码](https://web3c.work/typescript/utility-types.html#nonnullable))

具体情况参考:

> https://github.com/microsoft/TypeScript/blob/v5.0.4/src/deprecatedCompat/deprecations.ts#L65  
> https://github.com/microsoft/TypeScript/blob/v5.0.4/src/deprecatedCompat/deprecations.ts#L82   
> https://github.com/microsoft/TypeScript/blob/v5.0.4/src/compiler/types.ts#L9781   
> https://github.com/microsoft/TypeScript/issues/14107   
> https://github.com/microsoft/TypeScript/issues/32164   

所以, 暂时无法实现`OverloadedParameters`啦 ......



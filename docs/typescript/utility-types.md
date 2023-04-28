---
outline: [2, 3]
---

# TypeScript Utility Types 
  
---------------------------------------

<a href="https://www.typescriptlang.org/docs/handbook/release-notes/typescript-5-0.html" alt="TypeScript">
  <img src="https://img.shields.io/badge/TypeScript-v5.0.4-blue?style=for-the-badge&logo=typescript" /></a>

基于TypeScript 5.0.4, 梳理一下通用的Utility Types, 点评实现原理, 帮助大家加深对TypeScript类型运算的理解

## 常用类型 {#common}

### **`Awaited<Type>`** {#awaited}
拆解Promise类型, 获得Promise的返回值类型, 并且可以递归拆解, 直至返回类型中不再出现`Promise`类型

#### 使用
```typescript
type A = Awaited<Promise<string>>;            // type A = string
type B = Awaited<Promise<Promise<number>>>;   // type B = number
type C = Awaited<boolean | Promise<number>>;  // type C = number | boolean
```

#### 源代码
```typescript{6-8}
/**
 * Recursively unwraps the "awaited type" of a type. Non-promise "thenables" should resolve to `never`. This emulates the behavior of `await`.
 */
type Awaited<T> =
    T extends null | undefined ? T : // special case for `null | undefined` when not in `--strictNullChecks` mode
        T extends object & { then(onfulfilled: infer F, ...args: infer _): any } ? // `await` only unwraps object types with a callable `then`. Non-object types are not unwrapped
            F extends ((value: infer V, ...args: infer _) => any) ? // if the argument to `then` is callable, extracts the first argument
                Awaited<V> : // recursively unwrap the value
                never : // the argument to `then` was not callable
        T; // non-object or non-thenable
```

#### 实现原理
::: tip
`T`是Union类型时, 条件类型推导的结果也会union成一个Union类型
:::

```typescript
type Once<T> = T extends Array<infer I> ? I : T;
type T = string | Array<number>;
type Item = Once<T>; // string | number
```

::: tip
利用泛型(generics)的递归, 来递归拆解类型
:::

```typescript
type GetItemValue<T> = T extends Array<infer I> ?  GetItemValue<I> : T;

type A1 = string[];
type A2 = string[][];
type A3 = string[][][];

type I1 = GetItemValue<A1>; // string
type I2 = GetItemValue<A2>; // string
type I3 = GetItemValue<A3>; // string
```

### **`Partial<Type>`** {#partial}
将类型的所有属性变为可选

#### 使用
```typescript
interface Todo {
  title: string;
  description: string;
}

type PartialTodo = Partial<Todo>;
/*
type PartialTodo = {
  title?: string | undefined;
  description?: string | undefined;
}
*/
```

#### 源代码
```typescript{5}
/**
 * Make all properties in T optional
 */
type Partial<T> = {
    [P in keyof T]?: T[P];
};
```

#### 实现原理
::: tip
利用类型映射(type mapping)可以基于已有类型生成新的类型
:::

```typeScript
type OptionsFlags<Type> = {
  [Property in keyof Type]: boolean;
};

type FeatureFlags = {
  darkMode: () => void;
  newUserProfile: () => void;
};
 
type FeatureOptions = OptionsFlags<FeatureFlags>;
/*
type FeatureOptions = {
    darkMode: boolean;
    newUserProfile: boolean;
}
*/
```

::: tip
`keyof`操作符, 可以获取类型的所有属性名, 且属性名的类型为`string | number | symbol`
:::

```typescript
type T = keyof { a: string, b: number, c: boolean }; // type T = "a" | "b" | "c"
```

::: tip
`keyof`操作符还可以和`as`子句(clause)结合, 重命名属性名
:::

```typescript
type Getters<Type> = {
    [Property in keyof Type as `get${Capitalize<string & Property>}`]: () => Type[Property]
};
 
interface Person {
    name: string;
    age: number;
    location: string;
}
 
type LazyPerson = Getters<Person>;
/*
type LazyPerson = {
    getName: () => string;
    getAge: () => number;
    getLocation: () => string;
}
*/
```

### **`Required<Type>`** {#required}
将类型的所有属性变为必需

#### 使用
```typescript
interface Props {
  a?: number;
  b?: string;
}

type RequiredProps = Required<Props>;
/*
type RequiredProps = {
  a: number;
  b: string;
}
*/
```

#### 源代码
```typescript{5}
/**
 * Make all properties in T required
 */
type Required<T> = {
    [P in keyof T]-?: T[P];
};
```

#### 实现原理
::: tip
`readonly` and `?`是两种类型属性修饰符(modifier), 在类型映射(mapping)时用`+`和`-`前缀可以增删修饰符, 如果前缀不存在, 默认为`+`
:::

```typescript
interface ReadOnlyType {
  readonly a: number;
  readonly b: string;
}

type WriteableType = {
  -readonly [P in keyof ReadOnlyType]: ReadOnlyType[P];
};
/*
type WriteableType = {
  a: number;
  b: string;
}
*/
```

### **`Readonly<Type>`** {#readonly}
将类型的所有属性变为只读

#### 使用
```typescript
interface Todo {
  title: string;
  description: string;
}

type ReadonlyTodo = Readonly<Todo>;
/*
type ReadonlyTodo = {
  readonly title: string;
  readonly description: string;
}
*/
```


#### 源代码
```typescript
/**
 * Make all properties in T readonly
 */
type Readonly<T> = {
    readonly [P in keyof T]: T[P];
};
```

#### 实现原理
::: tip
参考 [Required](#required)
:::

### **`Record<Keys, Type>`** {#record}
构造一个对象类型, 其属性名为`Keys`的类型, 属性值为`Type`的类型

#### 使用
```typescript
interface CatInfo {
  age: number;
  breed: string;
}
 
type CatName = "miffy" | "boris" | "mordred";
 
const cats: Record<CatName, CatInfo> = {
  miffy: { age: 10, breed: "Persian" },
  boris: { age: 5, breed: "Maine Coon" },
  mordred: { age: 16, breed: "British Shorthair" },
};
```

#### 源代码
```typescript
/**
 * Construct a type with a set of properties K of type T
 */
type Record<K extends keyof any, T> = {
    [P in K]: T;
};
```

#### 实现原理
::: tip
`keyof any` 即 `number | string | symbol`, 因为只有这三种类型可以作为对象的key
:::

```typescript
type T = keyof any; // number | string | symbol
```

### **`Pick<Type, Keys>`** {#pick}
构造一个对象类型, 其属性名来自`Keys`, 其属性值的类型和`Type`中的同名属性相同

#### 使用
```typescript
interface Todo {
  readonly title: string;
  description?: string;
  completed: boolean;
}

type TodoPreview = Pick<Todo, 'title' | 'description'>;
/*
type TodoPreview = {
    readonly title: string;
    description?: string | undefined;
}
*/
```

#### 源代码
```typescript
/**
 * From T, pick a set of properties whose keys are in the union K
 */
type Pick<T, K extends keyof T> = {
    [P in K]: T[P];
};
```

#### 实现原理
::: tip
`K extends keyof T`意味着只能使用`T`中已经存在的属性名
:::

### **`Omit<Type, Keys>`** {#omit}
构造一个新类型, 除了`Keys`中的属性名外, 把`Type`中的所有属性及类型复制过来

#### 使用
```typescript
interface Todo {
  readonly title: string;
  description?: string;
  completed: boolean;
}

type TodoTitle = Omit<Todo, 'title' | 'completed'>;
/*
type TodoTitle = {
    readonly title: string;
}
*/
```

#### 源代码
```typescript
/**
 * Construct a type with the properties of T except for those in type K.
 */
type Omit<T, K extends keyof any> = Pick<T, Exclude<keyof T, K>>;
```

#### 实现原理
::: tip
`Omit`是`Pick`和`Exclude`的组合, 先取出所有属性名, 再排除`Keys`中的属性名, 最后再从`Type`中取出剩余的属性名
:::

### **`Exclude<UnionType, ExcludedMembers>`** {#exclude}
从`UnionType`中排除`ExcludedMembers`的类型

#### 使用
```typescript
type T0 = Exclude<"a" | "b" | "c", "a">;  // "b" | "c"
```

#### 源代码
```typescript
/**
 * Exclude from T those types that are assignable to U
 */
type Exclude<T, U> = T extends U ? never : T;
```

#### 实现原理
::: tip
`T extends U ? never : T`意味着如果`T`是`U`的子类型, 则返回`never`, 否则返回`T`
:::

::: tip
利用`T | never` = `T` 的特性, 可以排除`U`类型
:::

### **`Extract<Type, Union>`** {#extract}
从`Type`中提取`Union`的类型, 即`Type`和`Union`的交集

#### 使用
```typescript
type T0 = Extract<"a" | "b" | "c", "a" | "f">;  // "a"
```

#### 源代码
```typescript
/**
 * Extract from T those types that are assignable to U
 */
type Extract<T, U> = T extends U ? T : never;
```

#### 实现原理
::: tip
参考 [Exclude](#exclude)
:::

### **`NonNullable<Type>`** {#nonnullable}
从`Type`中排除`null`和`undefined`

#### 使用
```typescript
type T0 = NonNullable<string | number | undefined | null>;  // string | number
```

#### 源代码
```typescript
type NonNullable<T> = T & {};
```

#### 实现原理
::: tip
这里着重解释一下`&`类型操作符, 也就是所谓的交集类型, 很多人最初不理解为啥A和B的交集类型是合并属性, 不是做交集么?    

实际上, 从集合论的观点, `A & B`生成的新类型是A和B的子集, 也就是A和B子类型, 或者说A包含AB且B包含AB;    

所以`AB extends A` `AB extends B`都是`true`, 那么当然要把`A`和`B`的属性都合并起来, 否则无法满足即是`A`的子类型, 又是`B`的子类型;  
:::

```typescript
interface A {
  a: string;
}
interface B {
  b: string;
}
type AB = A & B;
/*
type AB = {
  a: string;
  b: string;
}
*/
```
  
::: tip
再看`NonNullable`的具体实现`T & {}`, 令:   
  
`T = string | number | null | undefined`     
  
那么:  
  
`T & {}` = `(string & {}) | (number & {}) | (null & {}) | (undefined & {})`  
  
上述运算的结果就是 `string | number`, 成功剔除`null`和`undefined`
:::

::: tip
这里利用了`{}`(**empty object type**)类型的特殊之处, 所有类型都是`{}`类型的子类型, `void` `null` `undefined`除外, 并且`{}`和这三个类型是互斥的, 不存在既是`null`又是`{}`(空对象)的类型, 可以参考以下代码  
:::

```typescript
declare const neverValue: never;
declare const voidValue: void;
let v: {} = {};

v = neverValue;   // 记住: 右值类型永远是左值类型的子类型!
v = 2;
v = { a: 'c', b: 1 };
v = true;

v = voidValue;    // ERROR
v = null;         // ERROR
v = undefined;    // ERROR

type Never1 = null & {};      // never
type Never2 = undefined & {}; // never
type Never3 = void & {};      // never, 虽然没有代码提示, 但类型为`void`的值是不存在的
```


### **`Parameters<Type>`** {#parameters}
获取函数类型的参数类型, 返回一个元组类型

#### 使用
```typescript
type T0 = Parameters<(a: string, b: number) => string>;  // [string, number]
```

#### 源代码
```typescript
/**
 * Obtain the parameters of a function type in a tuple
 */
type Parameters<T extends (...args: any) => any> = T extends (...args: infer P) => any ? P : never;
```

#### 实现原理
::: tip
`(...args: any) => any`表示任意函数类型
:::

```typescript
type F = (...args: any) => any;
let f: F = () => {};
f = (a: string) => a;
f = (a: string, b: number) => true;
```

::: tip
`T extends (...args: infer P)`使用`infer`子句可以推导`T`的参数类型
:::

### **`ConstructorParameters<Type>`** {#constructorparameters}
获取构造函数类型的参数类型, 返回一个元组类型

#### 使用
```typescript
type T0 = ConstructorParameters<ErrorConstructor>;     // [message?: string]
type T1 = ConstructorParameters<FunctionConstructor>;  // string[]
type T2 = ConstructorParameters<RegExpConstructor>;    // [pattern: string | RegExp, flags?: string]
type T3 = ConstructorParameters<any>;                  // unknown[]
```

#### 源代码
```typescript
/**
 * Obtain the parameters of a constructor function type in a tuple
 */
type ConstructorParameters<T extends abstract new (...args: any) => any> = T extends abstract new (...args: infer P) => any ? P : never;
```

#### 实现原理
::: tip
`new (...args: any) => any`表示任意构造函数类型, 类似Java中的Class类, 也就是`class`类型, 这里加上`abstract`是为了包含`abstract class`, 保证`ConstructorParameters`也能用于获取抽象类的构造器参数  
  
实际上, `new (...args: any) => any`是`abstract new (...args: any) => any`的子类型
:::

```typescript
type BF = abstract new (...args: any) => any;
type F = new (...args: any) => any;

abstract class A {}
class B {}

let f: F;
f = B;
f = A;               // ERROR
f = function() {};   // ERROR

let bf: BF;
bf = B;
bf = A;
bf = function() {};  // ERROR
```

### **`ReturnType<Type>`** {#returntype}
获取函数类型的返回值类型

#### 使用
```typescript
type T0 = ReturnType<() => string>;  // string
```

#### 源代码
```typescript
/**
 * Obtain the return type of a function type
 */
type ReturnType<T extends (...args: any) => any> = T extends (...args: any) => infer R ? R : any;
```

#### 实现原理
::: tip
参考 [Parameters](#parameters)
:::

### **`InstanceType<Type>`** {#instancetype}
获取构造函数类型的实例类型, 其在类似反射的场景中非常有用

#### 使用
```typescript
class A {}
type AConstructor = typeof A;
type T0 = InstanceType<AConstructor>;  // A
const o: T0 = new A();
```

```typescript
function createInstance<T extends new (...args: any) => any>(clazz: T): InstanceType<T> {
  return new clazz();
}
class A {}

const instance = createInstance(A);
```

#### 源代码
```typescript
/**
 * Obtain the return type of a constructor function type
 */
type InstanceType<T extends abstract new (...args: any) => any> = T extends abstract new (...args: any) => infer R ? R : any;
```

#### 实现原理
::: tip
参考 [ReturnType](#returntype)
:::

### **`ThisParameterType<Type>`** {#thisparametertype}
获取函数类型的`this`类型, 其在一些通过函数共享代码逻辑的场景中非常有用

#### 使用
首先, 我们定义一个函数, 仅能在`Number`类型上调用, 代码如下:
```typescript{1}
function toHex(this: Number) {
  return this.toString(16);
}
```

然后, 我们利用`ThisParameterType`可以限制`toHex`的调用者类型, 代码如下:
```typescript
function numberToString(n: ThisParameterType<typeof toHex>) {
  return toHex.apply(n);
}
```

#### 源代码
```typescript
/**
 * Extracts the type of the 'this' parameter of a function type, or 'unknown' if the function type has no 'this' parameter.
 */
type ThisParameterType<T> = T extends (this: infer U, ...args: never) => any ? U : unknown;
```

#### 实现原理
::: tip
参考 [Parameters](#parameters)
:::

### **`OmitThisParameter<Type>`** {#omitthisparameter}
把`this`参数类型从函数类型中去除

#### 使用
```typescript
function toHex(this: Number) {
  return this.toString(16);
}

const fiveToHex: OmitThisParameter<typeof toHex> = toHex.bind(5);

console.log(fiveToHex());
```

#### 源代码
```typescript
/**
 * Removes the 'this' parameter from a function type.
 */
type OmitThisParameter<T> = unknown extends ThisParameterType<T> ? T : T extends (...args: infer A) => infer R ? (...args: A) => R : T;
```

#### 实现原理
::: tip
注意条件类型的写法`unknown extends ThisParameterType<T>`, 结合`ThisParameterType`的实现代码, 可以理解为`ThisParameterType`返回`unknown`时, 表示`T`不是函数类型, 直接返回`T`, 否则返回函数类型的参数类型和返回值类型  
:::

::: warning
以上写法为什么不能写成`ThisParameterType<T> extends unknown`呢?  
因为`A extends B`表示`A`是`B`的子类型, 在TypeScript中, `unknown`和`any`是`top type`, 即所有其他类型都是这两个类型的子类型, 所以`ThisParameterType<T> extends unknown`永远为`true`
:::

::: tip
`any`和`unknown`都是`top type`, `unknown`是更安全版本的`any`, 而类型声明为`top type`的变量, 可以把任何类型的值赋给它    
但是`any`类型的值也可以赋给任何其他类型, 除了`never`
:::

```typescript
declare const anyValue: any;
let num: number = anyValue;
let str: string = anyValue;
let unknownValue: unknown = anyValue;
let nullValue: null = anyValue;
let undefinedValue: undefined = anyValue;
let voidValue: void = anyValue;
let neverValue: never = anyValue;     // ERROR
```
::: tip
`never`则是`bottom type`, 也就是说`never`是任何类型的子类型
:::

```typescript
declare const neverValue: never;
let num: number = neverValue;
let str: string = neverValue;
let anyValue: any = neverValue;
let unknownValue: unknown = neverValue;
let nullValue: null = neverValue;
let undefinedValue: undefined = neverValue;
let voidValue: void = neverValue;
```

::: warning
理论上`T extends never`永远为`false`, 但是TypeScript中有一些特例:
:::

```typescript
type Never<T> = T extends never ? true : false;
type Number1 = Never<boolean>;      // false 
type Number2 = Never<string>;       // false 
type Number3 = Never<void>;         // false 
type Number4 = Never<unknown>;      // false 
type Number5 = Never<{}>;           // false 
type NumberOrString = Never<any>;   // false | true = boolean
type Never1 = Never<never>;         // never
```

::: danger
这里不再继续展开讨论, 但是要注意, `any` `unknown` `never` 这三个类型出现在条件类型中 `extends` 的左右两边时, 会有很多奇异的行为!!!!
:::

### **`ThisType<Type>`** {#thistype}
`ThisType`实际上是一个`interface`, 用于标记`this`类型

#### 使用
:::warning
开启 `noImplicitThis` 编译选项后, `this`类型不再会被推断为`any`类型, 此时需要使用`ThisType`标记`this`类型  
:::

```typescript
type ObjectDescriptor<D, M> = {
  data?: D;
  methods?: M & ThisType<D & M>; // Type of 'this' in methods is D & M
};
 
function makeObject<D, M>(desc: ObjectDescriptor<D, M>): D & M {
  let data: object = desc.data || {};
  let methods: object = desc.methods || {};
  return { ...data, ...methods } as D & M;
}
 
let obj = makeObject({
  data: { x: 0, y: 0 },
  methods: {
    moveBy(dx: number, dy: number) {
      this.x += dx; // Strongly typed this
      this.y += dy; // Strongly typed this
    },
  },
});

 
obj.x = 10;
obj.y = 20;
obj.moveBy(5, 5);
```

#### 源代码
```typescript
/**
 * Marker for contextual 'this' type
 */
interface ThisType<T> { }
```

#### 实现原理
::: tip
空白的接口, 用于标记`this`类型
:::

## **Intrinsic String Manipulation Types** {#intrinsic-string-manipulation-types}
TypeScript提供了一些内置的字符串操作类型, 用于操作字符串类型, 由`tsc`编译器内部实现(`intrinsic`)

### **`Uppercase<StringType>`** {#uppercase}
### **`Lowercase<StringType>`** {#lowercase}
### **`Capitalize<StringType>`** {#capitalize}
### **`Uncapitalize<StringType>`** {#uncapitalize}

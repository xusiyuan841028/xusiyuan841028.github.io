---
outline: [2, 3]
---

# [翻译] Announcing TypeScript 5.1 Beta

---------------------------------------

<a href="https://devblogs.microsoft.com/typescript/announcing-typescript-5-1-beta/" alt="TypeScript" target="_blank">
  <img src="https://img.shields.io/badge/TypeScript-v5.1 beta-blue?style=for-the-badge&logo=typescript" /></a>

---------------------------------------

> 原文 https://devblogs.microsoft.com/typescript/announcing-typescript-5-1-beta/

## 如何安装 {#install}
```sh
npm install -D typescript@beta
```

## TypeScript 5.1新特性一览 {#list}

* [Easier Implicit Returns for `undefined`-Returning Functions](https://devblogs.microsoft.com/typescript/announcing-typescript-5-1-beta/#easier-implicit-returns-for-undefined-returning-functions)
* [Unrelated Types for Getters and Setters](https://devblogs.microsoft.com/typescript/announcing-typescript-5-1-beta/#unrelated-types-for-getters-and-setters)
* [Decoupled Type-Checking Between JSX Elements and JSX Tag Types](https://devblogs.microsoft.com/typescript/announcing-typescript-5-1-beta/#decoupled-type-checking-between-jsx-elements-and-jsx-tag-types)
* [Namespaced JSX Attributes](https://devblogs.microsoft.com/typescript/announcing-typescript-5-1-beta/#namespaced-jsx-attributes)
* [`typeRoots` Are Consulted In Module Resolution](https://devblogs.microsoft.com/typescript/announcing-typescript-5-1-beta/#typeroots-are-consulted-in-module-resolution)
* [Linked Cursors for JSX Tags](https://devblogs.microsoft.com/typescript/announcing-typescript-5-1-beta/#linked-cursors-for-jsx-tags)
* [Snippet Completions for `@param` JSDoc Tags](https://devblogs.microsoft.com/typescript/announcing-typescript-5-1-beta/#snippet-completions-for-param-jsdoc-tags)
* [Optimizations](https://devblogs.microsoft.com/typescript/announcing-typescript-5-1-beta/#optimizations)
* [Breaking Changes](https://devblogs.microsoft.com/typescript/announcing-typescript-5-1-beta/#breaking-changes)

## 更便捷地从函数中隐式返回`undefined` {#undefined}

在JavaScript中, 如果函数结束时没有触发一个`return`语句, 它将返回`undefined`值

```javascript
function foo() { 
	// no return 
} 

// x = undefined 
let x = foo();
```

但是之前版本的TypeScript, 函数没有return语句的话, 只能返回`void`或`any`, 如果要显式返回`undefined`值, 必须有至少一个return语句

```typescript
// ✅ fine - we inferred that 'f1' returns 'void' 
function f1() { 
	// no returns 
} 

// ✅ fine - 'void' doesn't need a return statement 
function f2(): void { 
	// no returns 
} 

// ✅ fine - 'any' doesn't need a return statement 
function f3(): any { 
	// no returns 
} 

// ❌ error! 
// A function whose declared type is neither 'void' nor 'any' must return a value. 
function f4(): undefined { 
	// no returns 
}
```

如果某些函数要返回`undefined`值, 必须至少显式地return `undefined`值, 或者一条单独的`return`语句加上显式的类型声明, 这造成一点不便

```typescript
declare function takesFunction(f: () => undefined): undefined;

// ❌ error!
// Argument of type '() => void' is not assignable to parameter of type '() => undefined'.
takesFunction(() => {
    // no returns
});

// ❌ error!
// A function whose declared type is neither 'void' nor 'any' must return a value.
takesFunction((): undefined => {
    // no returns
});

// ❌ error!
// Argument of type '() => void' is not assignable to parameter of type '() => undefined'.
takesFunction(() => {
    return;
});

// ✅ works
takesFunction(() => {
    return undefined;
});

// ✅ works
takesFunction((): undefined => {
    return;
});
```

首先, TypeScript 5.1现在允许直接返回`undefined`值, 而不再需要return语句

```typescript
// ✅ Works in TypeScript 5.1!
function f4(): undefined {
    // no returns
}

// ✅ Works in TypeScript 5.1!
takesFunction((): undefined => {
    // no returns
});
```

其次, 如果函数没有返回表达式, 且被作为希望返回`undefined`的函数传递时, TypeScript为该函数推导返回类型为`undefined`

```typescript
// ✅ Works in TypeScript 5.1!
takesFunction(function f() {
    //                 ^ return type is undefined
    // no returns
});

// ✅ Works in TypeScript 5.1!
takesFunction(function f() {
    //                 ^ return type is undefined
    return;
});
```

为了解决另一个相似的痛点, 启用`--noImplicitReturns`编译选项时, 只返回`undefined`的函数也会有类似的例外, 不再需要每个代码结束路径都有显式的`return`

```typescript
// ✅ Works in TypeScript 5.1 under '--noImplicitReturns'!
function f(): undefined {
    if (Math.random()) {
        // do some stuff...
        return;
    }
}
```

>**参考**:  
>issue: https://github.com/microsoft/TypeScript/issues/36288   
>pull request: https://github.com/microsoft/TypeScript/pull/53607

## 不再关联的Getters和Setters类型 {#unrelated}

在TypeScript 4.3变更中, 可以让`get`和`set`的配对访问器有两种不同的类型

```typescript
interface Serializer {
    set value(v: string | number | boolean);
    get value(): string;
}

declare let box: Serializer;

// Allows writing a 'boolean'
box.value = true;

// Comes out as a 'string'
console.log(box.value.toUpperCase());
```

最初, 我们需要`get`的类型是`set`类型的子类型, 这意味着以下赋值语句是合法的:

```typescript
box.value = box.value; // `string` extends `string | number | boolean`
```

但是有大量现存和被提议的API需要完全无关联的getter和setter类型. 例如, 一个最常见的例子, DOM的`style`属性和[`CSSStyleRule`](https://developer.mozilla.org/en-US/docs/Web/API/CSSStyleRule) API. 每个style rule都有一个[`style`属性](https://developer.mozilla.org/en-US/docs/Web/API/CSSStyleRule/style), 类型为[`CCSStyleDeclaration`](https://developer.mozilla.org/en-US/docs/Web/API/CSSStyleDeclaration), 而写入这个属性时, 只接受string值 

TypeScript 5.1现在允许提供显式的类型注释提供完全无关的`get`和`set`访问器类型, 该版本不再修改这些内置接口的类型, `CSSStyleRule`现在可以如下定义:
```typescript
interface CSSStyleRule {
	// ... 
	
	/** Always reads as a `CSSStyleDeclaration` */ 
	get style(): CSSStyleDeclaration; 
	
	/** Can only write a `string` here. */ 
	set style(newValue: string); 
	
	// ... 
}
```

这也允许如下代码模式, `set`访问器只接受合法数据, 但`get`访问器在内部状态还没有初始化时可以返回`undefined`, 这类似optional属性在开启`--exactOptionalProperties`时的检查.

```typescript
class SafeBox { 
	#value: string | undefined; 
	
	// Only accepts strings! 
	set value(newValue: string) { } 
	
	// Must check for 'undefined'! 
	get value(): string | undefined { 
		return this.#value; 
	} 
}
```

> **参考**:  
> * [实现PR](https://github.com/microsoft/TypeScript/pull/53417)

## 解耦JSX元素和JSX Tag类型之间的类型检查 {#jsx}

过去在JSX和TypeScript一起使用的一个痛点是需要知道每种JSX元素Tag的类型.

一个JSX元素如下:

```jsx
// A self-closing JSX tag
<Foo />

// A regular element with an opening/closing tag
<Bar></Bar>
```

当对`<Foo />`或`<Bar></Bar>`执行类型检查是, TypeScript检索`JSX`名称空间(namespace), 从`Element`中查找类型, 即检索`JSX.Element`

但是无论是`Foo`还是`Bar`作为Tag名称都是合法的, TypeScript会粗略的获取返回的类型(函数组件), 检查是否兼容`JSX.Element`, 如果是类组件, 则检查类构造的实例类型是否兼容`JSX.ElementClass`

这些限制意味着函数组件返回类型除了`JSX.Element`不能是其他更广泛的类型, 例如, 一个JSX库可能可以支持组件函数返回`string`或者`Promise`

一个更具体的例子: [React is considering adding limited support for components that return `Promise`s](https://github.com/acdlite/rfcs/blob/first-class-promises/text/0000-first-class-support-for-promises.md) (React提案支持组件函数返回Promise), 但是当前版本的TypeScript在不极大地放宽`JSX.Element`类型限制的情况无法表达这类类型声明

```typescript
import * as React from "react";

async function Foo() {
    return <div></div>;
}

let element = <Foo />;
//             ~~~
// 'Foo' cannot be used as a JSX component.
//   Its return type 'Promise<Element>' is not a valid JSX element.
```

为了支持这类特性, TypeScript 5.1现在会检索类型`JSX.ElementType`, 该类型精准的指定那些可以合法的用于JSX元素, 目前该类型定义大致如下:

```typescript
namespace JSX {
	export type ElementType =
		// All the valid lowercase tags
		keyof IntrinsicAttributes
		// Function components
		(props: any) => Element
		// Class components
		new (props: any) => ElementClass;

	export interface IntrinsictAttributes extends /*...*/ {}
	export type Element = /*...*/;
	export type ClassElement = /*...*/;
}
```

## 带名称空间的JSX Attribute {#namespaced}

TypeScript 5.1支持带名称空间的JSX属性名称

```typescript
import * as React from "react";

// Both of these are equivalent:
const x = <Foo a:b="hello" />;
const y = <Foo a : b="hello" />;

interface FooProps {
	"a:b": string;
}

function Foo(props: FooProps) {
	return <div>{props["a:b"]}</div>;
}
```

如果标签名称的第一段是小写名称, 带名称空间的标签名称的检索类似`JSX.IntrinsicAttributes`

```typescript
// In some library's code or in an augmentation of that library: 
namespace JSX { 
	interface IntrinsicElements { 
		["a:b"]: { prop: string }; 
	}
}

// In our code: 
let x = <a:b prop="hello!" />;
```

## 在模块查找参考`typeRoots`设置 {#typeRoots}

当TypeScript指定的模块查找策略无法定位路径时, 将根据相对于`typeRoots`的路径来查找模块包

> 简单地说, TypeScript查找模块时会尝试`typeRoots`中加载, 检索优先级排在`@types`之后

> **参考:**  
>issue: https://github.com/microsoft/TypeScript/pull/51715  
>pull request: https://github.com/microsoft/TypeScript/pull/51715/commits/a6fed14f5bb2279bac45f348f49ee984baa3512d

## 编辑JSX标签时链接光标 {#cursor}
<p>
  <img src="https://devblogs.microsoft.com/typescript/wp-content/uploads/sites/11/2023/04/linkedEditingJsx-5.1-1.gif" alt="" style="margin-top: 16px; margin-bottom: 16pjjjx">
</p>
该功能同时支持TypeScript和JavaScript, 可以在Visual Studio Code Insider中开启, 也可以编辑UI设置的`Editor: linked Editingn`选项

<p>
  <img src="https://devblogs.microsoft.com/typescript/wp-content/uploads/sites/11/2023/04/linkedEditing-5.1-vscode-ui-1.png" alt="" style="margin-top: 16px; margin-bottom: 16pjjjx">
</p>
或者在JSON设置文件中设置`editor.linkedEditing`字段

```json
{
	// ... 
	"editor.linkedEditing": true,
}
```

## JSDoc标签`@param`的片段自动完成 {#jsdoc}

<p>
  <img src="https://devblogs.microsoft.com/typescript/wp-content/uploads/sites/11/2023/04/paramTagSnippets-5-1-1.gif" alt="" style="margin-top: 16px; margin-bottom: 16pjjjx">
</p>

## 优化 {#optimizations}

参考 https://devblogs.microsoft.com/typescript/announcing-typescript-5-1-beta/#optimizations

## 破坏性修改 {#breaking}
### ES2020和Node.js 14.17是TypeScript最低的运行时需求(运行tsc和tsserver) {#runtime}

如果需要在更旧版本的Node.js如Node 10或12中执行TypeScript 5.1, `tsc.js`或者`tsserver.js`会报错

```log
node_modules/typescript/lib/tsserver.js:2406
  for (let i = startIndex ?? 0; i < array.length; i++) {
                           ^
 
SyntaxError: Unexpected token '?'
    at wrapSafe (internal/modules/cjs/loader.js:915:16)
    at Module._compile (internal/modules/cjs/loader.js:963:27)
    at Object.Module._extensions..js (internal/modules/cjs/loader.js:1027:10)
    at Module.load (internal/modules/cjs/loader.js:863:32)
    at Function.Module._load (internal/modules/cjs/loader.js:708:14)
    at Function.executeUserEntryPoint [as runMain] (internal/modules/run_main.js:60:12)
    at internal/main/run_main_module.js:17:47
```

另外, 尝试通过npm安装TypeScript时也会报错:

```log
npm WARN EBADENGINE Unsupported engine {
npm WARN EBADENGINE   package: 'typescript@5.1.0-beta',
npm WARN EBADENGINE   required: { node: '>=14.17' },
npm WARN EBADENGINE   current: { node: 'v12.22.12', npm: '8.19.2' }
npm WARN EBADENGINE }
```

如果用yarn:

```log
error typescript@5.1.0-beta: The engine "node" is incompatible with this module. Expected version ">=14.17". Got "12.22.12"
error Found incompatible module.
```

### 显式设置`typeRoots`会禁用`node_modules/@types`的向上层遍历 {#types}

之前如果在`tsconfig.json`中设置`typeRoots`, 但是查找任何`typeRoots`中设置的目录都失败时, TypeScript仍然会继续向上层目录遍历, 尝试在每一级上层目录中的`node_modules/@types`中查找模块

这会导致过量的查找, 所以在TypeScript 5.1中禁用. 所以, 设置了`tsconfig.json`的`types`字段, 或者使用`/// <reference >`指令, 可能会出现以下错误:

```log
error TS2688: Cannot find type definition file for 'node'. 
error TS2688: Cannot find type definition file for 'mocha'. 
error TS2688: Cannot find type definition file for 'jasmine'. 
error TS2688: Cannot find type definition file for 'chai-http'. 
error TS2688: Cannot find type definition file for 'webpack-env"'.
```

解决办法是在`typeRoots`中添加`node_modules/@types`
```json
{
    "compilerOptions": {
        "types": [
            "node",
            "mocha"
        ],
        "typeRoots": [
            // Keep whatever you had around before.
            "./some-custom-types/",

            // You might need your local 'node_modules/@types'.
            "./node_modules/@types",

            // You might also need to specify a shared 'node_modules/@types'
            // if you're using a "monorepo" layout.
            "../../node_modules/@types",
        ]
    }
}
```

## 后续 {#next}
TypeScript 5.1将继续开发数周时间, 会有一个候选发布版本(release candicate)和一个最终稳定发布版本. 具体迭代计划参考 https://github.com/microsoft/TypeScript/issues/53031

接下来的开发工作包括bugfix和一些低风险的面向编辑器的特性, 以及一些新特性的迭代开发. 这意味着, TypeScript beta是试用TypeScript下一代版本的最好途径, 也可以通过[nightly build](https://www.typescriptlang.org/docs/handbook/nightly-builds.html)来获取TypeScript 5.1的最新状态.

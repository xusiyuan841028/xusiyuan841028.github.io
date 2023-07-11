# Promise使用的各种技巧

大厂面试中Promise是常见的一类编程笔试题, 其核心技巧在于巧用闭包和Promise链

本文讨论使用函数式编程, 通过λ演算来生成新的async函数, 在尽可能不修改已有代码的前提下就可以为现有的async函数添加新特性

::: info
我们先构造一个async函数来辅助测试:  
`time`: 返回的`promise`在`time`秒后fulfill  
`result`: resolve时的`result`, reject时的`reason`  
`isResolved`: 为`true`时, 返回的promise被resolve, 否则被rejected  
:::

```typescript
async function asyncRun(time: number, result: any = time, isResolve: boolean = true): Promise<number> {
  console.log(`${Date().toString()} - start:  ${result}`)
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (isResolve) {
        console.log(`${Date().toString()} - resolve:  ${result}`);
        resolve(result);
      } else {
        console.log(`${Date().toString()} - reject:  ${result}`);
        reject(result);
      }
    }, 1000 * time)
  });
}
```

## 可以手动控制的Promise {#manual}

::: tip
利用闭包透传`resolve` `reject`方法
:::

[**RUN ME**](https://www.typescriptlang.org/play?target=5&ssl=19&ssc=10&pln=1&pc=1#code/JYOwLgpgTgZghgYwgAgApQPYFtgGcIAScIAJgDYQA8AKgHzIDeAsAFDLJQS4ZkBuEALmQAKXnDIBXQcmoBKZAF56vDMBIBuVu04ArCAjBDhnONxAB+IcQCe8pchVrNLAL6tWMCSAPAMIZADmEGAAwn5gmGQUJOjYeFTUisheANYgGADuILTCskIMyAAOmDj4QrGlCbQANMgAFsTk0hXxRKQUNLQujFrIFGD1jRTlJa1DVc7sCH64A8Vx+EkgEBloo-idwsZcPPy1uvpgdvTMbOyD7SgKjBw7fBD7EHoGyC6Tr7LvnGASUP4F80qtQalyEIKaAEJXs43CxWAB6eEyACiAGVqABJAByAHFkCEAPIAEWRELJENY0xAsxugPiwPGrySQVC4Ui0RaGxAEiwACNoDlPqw6fgAHRgOoQEDGRT0KncCiisgYALCABEnAV-CEav2slkrHwYGowCwEAwEjAW2OPTO4MVmt2EGEAEYha5agAmAAMvs+QA)
 
```typescript{11}
interface PromiseHandle<T> {
  resolve: (value: T) => void;
  reject: (reason?: any) => void;
}

function getControlledPromise<T = unknown>(): { promise: Promise<T>, handle: PromiseHandle<T>} {
  let handle: PromiseHandle<T>;
  const promise = new Promise<T>((resolve, reject) => {
    handle = { resolve, reject };
  });
  return { promise, handle: handle! };
}

// TESTING CODE!!!!
const { promise, handle } = getControlledPromise<number>();
promise.then(r => console.log(r))
handle.resolve(1);
```

## cancel - 让一个async函数可以被取消 {#cancel}

::: tip
利用闭包透传`reject`方法, 手动cancel
:::

[**RUN ME**](https://www.typescriptlang.org/play?target=5#code/IYZwngdgxgBAZgV2gFwJYHsI1JKAlJACjQFsBTALhggRICMyAnAGhkbJAQBtkrgIwMALwxSZVqhB4O6LgDdKMOulll+w0YwRkAlFQAKjdCUlkAPDXpMAfDADeAWABQMGFEwhVAOi7oA5oQABgAkdgAiwMhkhDpeyOgAysiMqBABOgC+MAC0MCDIwIy8rqHsnDwZgTrOruzICIxYEGQA7jCGxqaEhGWyCqzsAFZkUMg6wraOLq55ZMgAKqjk6AjI3eNCkzUzrqhwMISS0p7yuvbbO67uECdkPv5BoRFRMXGJyanpWbm9p1QwpQ43GQlR0AG4LpdfgoekCeODIa4smQuCAyOdppc3B5vL4AiFwpForF4kkUmkYt82GRhqN-oDyiCqhDMVCaSM1mVgQjWUjIRlWABGAAMopgACpREtdNsMjyMs5nMgwAAHdEAYX4UBRXGAdC4ZA6JjRZnmthERtMptsADIMVctSiqLDQJgAPx8AQbWxydCoAAmzgVTmciBQGCwUEdXF1+vM8xgZAAHlEIP6QAcvFnCn4QJ6wABtAC63vaRmN5n4YGs1kIcCo8z0mezjFzBkKwHIUUYIGtpc10B1eoNlpNAEEWsBUFF-WZpPVGvNVfGa1tpsq1TA8BoJ1OZ3O5g0IEu1dbrCzaofGs2vDm8+0O12mL2zU2B9qY8PDeWrXhzWudgNZBqVpZAADEIGddhXQgD1sC9CYYF9AMLxmICYBVH80QMLDzD-DRmjaUdolhE5+hAjlSzsGBEQo0YII0IYOVQnY4FvFUVS4MBCBoGNWDvEkAAsyAgUi+l0Lwo2QKBBNhUCeR2OUWIOTDOjRbAM3fIc42IudrFiKNBy4DQw1GCMXU8WD83GKYsSY+jROgyyFJmDJlLqI8VNwjSYC0z8dNwvSXLcoNFScAB6cKYHmABRBJ5gASQAOQAcV8gB5MIYoAQly7LnHQ-YREMj9YwNQgcGgAgIB5a58gw7yRDgQgAFYeVUis4mE0TSNLOrcQeAByTgoG1EB70GgYOB0AzIhknpEP6g17gCQa4CnLgqEmtgZpZNEFmlFY1hiRDbIatS7hKlFCEGwVBvlVgAGZRWFaonCAA)

```typescript{11,15}
type CancellablePromise<T> = Promise<T> & {
  cancel: (reason?: any) => void
}

function cancellable<T extends (...args: any[]) => Promise<any>>(f: T): (...args: Parameters<T>) => CancellablePromise<Awaited<ReturnType<T>>> {
  type R = Awaited<ReturnType<T>>;
  return (...args: Parameters<T>): CancellablePromise<R> => {
    let rejectFn: (reason?: any) => void;
    let promise: Promise<R> = new Promise((resolve, reject) => { 
      rejectFn = reject;
      f.apply(null, args).then(resolve).catch(reject);
    });
    (promise as CancellablePromise<R>).cancel = function(reason?: any) {
      rejectFn(reason);
    };
    return (promise as CancellablePromise<R>);
  };
}

// TESTING CODE!!!!
let f = cancellable(asyncRun);
const promise = f(5);
promise.then((res) => console.log('success: ', res)).catch(r => console.log('fail: ', r));
setTimeout(() => {
  promise.cancel('1');
}, 3000)
```

## timeout - 让一个async函数超时 {#timeout}

::: tip
通过`setTimeout`设置定时器来`reject`, 被`reject`的`promise`无法再次被`resolve`, 被`resolve`的`promise`也无法再次被`reject`
:::

[**RUN ME**](https://www.typescriptlang.org/play?target=5#code/IYZwngdgxgBAZgV2gFwJYHsI1JKAlJACjQFsBTALhggRICMyAnAGhkbJAQBtkrgIwMALwxSZVqhB4O6LgDdKMOulll+w0YwRkAlFQAKjdCUlkAPDXpMAfDADeAWABQMGFEwhVAOi7oA5oQABgAkdgAiwMhkhDpeyOgAysiMqBABOgC+MAC0MCDIwIy8rqHsnDwZgTrOruzICIxYEGQA7jCGxqaEhGWyCqzsAFZkUMg6wraOLq55ZMgAKqjk6AjI3eNCkzUzrqhwMISS0p7yuvbbO67uECdkPv5BoRFRMXGJyanpWbm9p1QwpQ43GQlR0AG4LpdfgoekCeODIa4smQuCAyOdppc3B5vL4AiFwpForF4kkUmkYt82GRhqN-oDyiCqhDMVCaSM1mVgQjWUjIRlWABGAAMopgACpREtdNsMjyMs5nIgUBgsGIVsgzPMYGQAB5RCAAExABy8ZsKfhAfAEAG0ALobWwdExosz8MDWayEOBUeasMRUSwMFjU0CYAD81sEAB8DoQLVb2oVgOQoowQFrrI7sAIdHpTebGJaDMnU0wM-MsxN2kYXeYAIItYCoKKGszSeqNeZgAAO5krnoxrmQvfReA0jebrfbcwaEG7fcz1hZtVnjQLXgTJcYKbm5cz+edpnbtk21FaNc6aO60PE1NpY2rUx2aIW0o16yfiJgXDmbCjGjsGGEArpcewHEBnhYAAZNBoijug+yQZgwhCCIADkyqjKq6HjM+WJsIBahQV4UDAFwXCEDQFGsAmPJYgqvL3hyPT0TMApSuQbGuHAhBmpuRYgCSAAWZAQLCJwKGxcosoxzgAPTyTA8wAKIJPMACSAByADiMAAMIAPJhCpACE5nONc+TwBo6qrPG4DQAQECsAAzKKwqsPGglRva2aBPWRbaCQEDIImoQJl4gzoKklLMkqhAAKwiWJN4cNmVm4g86GcFAUAcIm6EDOlsRkcgUDCT01aZb+9wBJhzZcFQRVsHmLKKk4QA)

```typescript{11,15}
function timeout<T extends (...args: any[]) => Promise<any>>(f: T, time: number, reason?: any | ((args: Parameters<T>) => any)): (...args: Parameters<T>) => Promise<Awaited<ReturnType<T>>> {
  type R = Awaited<ReturnType<T>>;
  return (...args: Parameters<T>): Promise<R> => new Promise((resolve, reject) => {
    setTimeout(() => reject(reason && typeof reason === 'function' ? reason.call(null, args) : reason), time);
    f(...args).then(resolve);
  });
}

// TESTING CODE!!!
const f = timeout(asyncRun, 3000, (args: any[]) => `Arguemnts: ${args.join()}`);
f(5).then((res) => console.log('success: ', res)).catch(r => console.log('fail: ', r));
```

## retry - 让一个async函数可以自动重试 {#retry}

::: tip
递归调用可以简化代码
:::

[**RUN ME**](https://www.typescriptlang.org/play?target=5#code/IYZwngdgxgBAZgV2gFwJYHsI1JKAlJACjQFsBTALhggRICMyAnAGhkbJAQBtkrgIwMALwxSZVqhB4O6LgDdKMOulll+w0YwRkAlFQAKjdCUlkAPDXpMAfDADeAWABQMGFEwhVAOi7oA5oQABgAkdgAiwMhkhDpeyOgAysiMqBABOgC+MAC0MCDIwIy8rqHsnDwZgTrOruzICIxYEGQA7jCGxqaEhGWyCqzsAFZkUMg6wraOLq55ZMgAKqjk6AjI3eNCkzUzrqhwMISS0p7yuvbbO67uECdkPv5BoRFRMXGJyanpWbm9p1QwpQ43GQlR0AG4LpdfgoekCeODIa4smQuCAyOdppc3B5vL4AiFwpForF4kkUmkYt82GRhqN-oDyiCqhDMVCaSM1mVgQjWUjIRlWABGAAMopgACpREtdNsMjyMs5nIgUBgsHVGGAzPMYGQAB5RCAAExABy8ZsKfhAfAEAG0ALobWwdExosz8MDWayEOBUeasMRW6i0BiMPSm82MS0GQrAchRRggLXWR3tIwu8wAQRawFQUUNZmk9Ua8zAAAdzPNPVtpsgy+i8Boszm8wW5g0ICXy0nrCzdvtiNKTWYYMLxlMdgGNMLezAFdM6u3w14LYH9DG40xE5Ww87TAXbJtqK1U500d1oeJqbSxhN7DBEfAkKNVWwiOxQJgAPzWsBjh99g4A2yXJrBEUcMSxHY4GXUtSy4MBCBoLguFYFcSQACzICBYROBRYigSIoHQnokGqXkZmRVF0XHSDanZUZYQ-CAeVoucsTYtkizVIgWIo+VFScAB6QSYHmABRBJ5gASQAOQAcRgABhAB5MIxIAQk05xrnyeANHVBCcGgAgIFYAAmHk4EIMzzNYOBgCojCsPPDgUx03EHgAck4KAoA4QNPIGVz8MI4jGFvdyuDuPFCE8+zUC4KhArYHQeWcIA)

```typescript
function retry<T extends (...args: any[]) => Promise<any>>(f: T, times: number): (...args: Parameters<T>) => Promise<Awaited<ReturnType<T>>> {
  type R = Awaited<ReturnType<T>>;
  if (times < 0) {
    times = 0;
  }
  return (...args: Parameters<T>): Promise<R> => new Promise((resolve, reject) => { 
      function run(reason?: any) {
        if (times-- >= 0) {
          f.apply(null, args).then(resolve).catch(run)
        } else {
          reject(reason);
        }
      }
      return run();
    });
}

// TESTING CODE!!!
const f = retry(asyncRun, 2);
f(2, 2, false).then((res) => console.log('success: ', res)).catch(r => console.log('fail: ', r));
```

## limit - 让一个async函数的并发调用受限 {#limit}

假设并发数为5, 一个async函数, 同时调用10次, 实际只调用5次, 每当有一次调用被fulfill后, 再开始执行一次被pending的调用, 直到所有调用完成  

::: tip
利用手动`promise`来调度函数调用  
利用`promise`链来返回调用结果
:::

[**RUN ME**](https://www.typescriptlang.org/play?target=5#code/IYZwngdgxgBAZgV2gFwJYHsI1JKAlJACjQFsBTALhggRICMyAnAGhkbJAQBtkrgIwMALwxSZVqhB4O6LgDdKMOulll+w0YwRkAlFQAKjdCUlkAPDXpMAfDADeAWABQMGFEwhVAOi7oA5oQABgAkdgAiwMhkhDpeyOgAysiMqBABOgC+MAC0MCDIwIy8rqHsnDwZgTrOruzICIxYEGQA7jCGxqaEhGWyCqzsAFZkUMg6wraOLq55ZMgAKqjk6AjI3eNCkzUzrqhwMISS0p7yuvbbO67uECdkPv5BoRFRMXGJyanpWbm9p1QwpQ43GQlR0AG4LpdfgoekCeODIa4smQuCAyOdppc3B5vL4AiFwpForF4kkUmkYt82GRhqN-oDyiCqhDMVCaSM1mVgQjWUjIRlWABGAAMopgACpREtdNsMjyMs5nIgUBgsFwlqhkPpCsAuFwUWZ5jAyAAPKIQAAmIAOXlthT8ID4AgA2gBdDa2DomNFmfhgazWQhwKjzVjqkzFSwMRh6G12xgOgw68hRRggQ3WD3tIze8wAQRawE1ZAtZmk9Ua8zAAAdzPMA1tpsga+i8BoC0WoqXyw0IFXaxnrCyrh5kDBC5r5qAANYaZptPOMRjAMAxYfwJCjVVsIi2rz2x3tZNzJjp+uxr2mMuNrHhzXZbLrnZ1XvwffV6tcVc0PWsA+xOBUl1L91gmDEsVcO9kAAamgp9LgnBYZx8Mg0mQAALGAADIsPHTspxAacvBAdC9jWHQ10RGA5XXBVphfRo433BND21ZcU1PDMLxzK88FsTZwJmPYDigmBbGFcYpixBisC0CBCD3f94ORVF0Sky59THaFFEIORdW0AweLRAAZVBp3MPiszkdBUAteDILmGBqyMxRLx9Pi51abNOjRbptIAMSzbSNACnksUQgiiOrBASNAgTtJ6Xd4wdHRUvs6kKywZyfLIZTZRZOjnAAeiKmB5gAUQSeYAEkADkAHEYAAYQAeTCcqAEIuuca58ngLARCgtjgJRQgcGgAgIFYABWHk4HQRhCE0mBUA0YUwRWmAzBgEUNtQWDJO2XrcQeAlnmJN4yU+Skck0QR8kKYoATsVBQXXOB5NQCQJBgABSGAACZhCEEQJIKxUnCAA)

```typescript{8,16-17}
function limitParallel<T extends (...args: any[]) => Promise<any>>(f: T, limit: number): (...args: Parameters<T>) => Promise<Awaited<ReturnType<T>>> {
  type R = Awaited<ReturnType<T>>;
  const waitTask = new Array();
  function run(...args: Parameters<T>): Promise<R> {
      limit--;
      return f.apply(null, args).finally(() => {
        limit++;
        waitTask.length && waitTask.shift()();
      });
  }
  return (...args: Parameters<T>): Promise<R> => {
    if (limit > 0) {
      return run(...args);
    } else {
      let resolve: (value: PromiseLike<R>) => void;
      let promise: Promise<R> = new Promise((resolveF) => resolve = resolveF);
      waitTask.push(() => resolve(run(...args)));
      return promise;
    }
  };
}

// TESTING CODE!!!
const fn = limitParallel(asyncRun, 5);
for(let i = 0; i < 10; i++) {
  console.log(`${Date().toString()} - try start:  ${i}`);
  fn(i, i % 2 === 0);
}
```

## throttle - 让一个async函数可以节流控制 {#throttle}

async函数的节流控制需要注意的是, 只拿最后一次调用的结果, 例如依次用"a", "ab", "abc"发送搜索请求来获取列表数据, 需要用最后一次"abc"搜索的结果来resolve前两次的结果; 通常我们采用一个标记字段(例如sequence_id)来标记最后一次调用来判断是否是最新结果, 但async函数可以利用promise链来实现

::: tip
利用`promise`链来返回调用结果, 利用闭包来获取最新的调用结果
:::

[**RUN ME**](https://www.typescriptlang.org/play?target=5#code/IYZwngdgxgBAZgV2gFwJYHsI1JKAlJACjQFsBTALhggRICMyAnAGhkbJAQBtkrgIwMALwxSZVqhB4O6LgDdKMOulll+w0YwRkAlFQAKjdCUlkAPDXpMAfDADeAWABQMGFEwhVAOi7oA5oQABgAkdgAiwMhkhDpeyOgAysiMqBABOgC+MAC0MCDIwIy8rqHsnDwZgTrOruzICIxYEGQA7jCGxqaEhGWyCqzsAFZkUMg6wraOLq55ZMgAKqjk6AjI3eNCkzUzrqhwMISS0p7yuvbbO67uECdkPv5BoRFRMXGJyanpWbm9p1QwpQ43GQlR0AG4LpdfgoekCeODIa4smQuCAyOdppc3B5vL4AiFwpForF4kkUmkYt82GRhqN-oDyiCqhDMVCaSM1mVgQjWUjIRlWABGAAMopgACpREtdNsMjyMs5nIgUBgsMgABZGZDILjmeYwMgADyiEAAJiADl4rYU-CA+AIANoAXQ2tg6JjRZn4YGs1kIcCo81YLWAqGKlgYjD0lutjFtBkKwHIUUYIDM82srvaRg95gAgiGw2RTWZpPVGvMwAAHPW+rbTZDV9F4DQF0NREtlhoQSs19O+lmuXXIGBcUDId2mAw50yl6yD0dzUfjxbkKgRpgaYULurdmNeG129qJ5NMNMZ6OTz14WybDE7PYHZ53CDoFoxHLL-Kr9G2Qtje9LgAeiAmBAFDYwAvxUAKDlAAA5QBCa0AIKDAEFbQAuZUAF9TADQjQAab3gwBgGMACldES-CcZzRDQ4APKsqy4MBCBoLguFYQ8eSxMdv2lDRny8V93xYmYFVZXdGmIq87g1MgIHWCYRNI3QFwyFkBOcECYHmABRBJ5gASQAOQAcRgABhAB5MI1IAQks5xrnyeAsBEDUtR1aIcGgAgIFYABWUVhR5YcYFQLcWX8sRGA0NFkC0iAUzkYAuCku8piuDwRyNGtRg0VAFzgSTAoAUhgAAWGAAH4ApgABqGBBRgKgACZhQkEl1Qk7oyizGzcQeQJkkEeIYD8JcuR4KhQjSjkBWwUYEDimjRrsMpQViKBIigdUemkzrdXuAIAHI4FDLgqF2gYdD4x9DgqqrrBEEVxiSmYoF1QoopiuLiGlKN5OcSaRVFHlnCAA)

```typescript{11}
function throttle<T extends (...args: any[]) => Promise<any>>(f: T, wait: number): (...args: Parameters<T>) => Promise<Awaited<ReturnType<T>>> {
  type R = Awaited<ReturnType<T>>;
  let lastPromise: Promise<R>;
  let lastTime: number = 0;
  return (...args: Parameters<T>): Promise<R> => {
    if (Date.now() - lastTime > wait) {
      // 超出上一次节流区间或第一次调用
      lastPromise = f.apply(null, args);
      lastTime = Date.now();
    }
    return lastPromise.then(() => lastPromise);
  };
}

// TESTING CODE!!!
const fn = throttle(asyncRun, 5000);
let i = 0;
let timer = setInterval(() => {
  const expect = i;
  fn(i % 4 ? i + 1 : 20, i).then((res) => console.log(`try to get result: ${expect}, actually: ${res}`)).catch(r => console.log('fail: ', r));
  if (i++ >= 10) {
    clearInterval(timer);
  }
}, 1000);
```

## debounce - 让一个async函数可以防抖控制 {#debounce}

::: tip
利用`promise`链来返回调用结果, 利用闭包来获取最新的调用结果
:::

[**RUN ME**](https://www.typescriptlang.org/play?target=5#code/IYZwngdgxgBAZgV2gFwJYHsI1JKAlJACjQFsBTALhggRICMyAnAGhkbJAQBtkrgIwMALwxSZVqhB4O6LgDdKMOulll+w0YwRkAlFQAKjdCUlkAPDXpMAfDADeAWABQMGFEwhVAOi7oA5oQABgAkdgAiwMhkhDpeyOgAysiMqBABOgC+MAC0MCDIwIy8rqHsnDwZgTrOruzICIxYEGQA7jCGxqaEhGWyCqzsAFZkUMg6wraOLq55ZMgAKqjk6AjI3eNCkzUzrqhwMISS0p7yuvbbO67uECdkPv5BoRFRMXGJyanpWbm9p1QwpQ43GQlR0AG4LpdfgoekCeODIa4smQuCAyOdppc3B5vL4AiFwpForF4kkUmkYt82GRhqN-oDyiCqhDMVCaSM1mVgQjWUjIRlWABGAAMopgACpREtdNsMjyMs5nIgUBgsAATMjKJBQczzGBkAAeUQgapABy8FsKfhAfAEAG0ALobWwdExosz8MDWayEOBUeasFrAVDFSwMRh6c2WxjWgyFYDkKKMEBmebWZ3tIxu8wAQSDIbIarM0nqjXmYAADrrvVtpshK+i8Bo88GokWSw0IOWq6nvSzXFw5jAuKBkK7TAYs6Zi9Z+8OhyP8otyFQw0wNMK53VO1GvFabe144mmCm05Hx+68LZNhidnsDs87hB0C0Yjlh6Pl+jbPmxrfLgA9ABMCAKGxgBfioAUHKAABygCE1oATGmAGlGgBcyoAL6mAGhGgA03rBgDAMYAFK6Ih++QXuiIhwHuFYVlwYCEDQXBcKw+7gq4-KQouCzShoj5eM+r48js26NIRY5TmicQABZkBA6wTEJxF8TAGQsgqTjOEBMDzAAogk8wAJIAHIAOIwAAwgA8mEGkAITWc41z5PAWAiBqWrQNEODQAQECsAArKKwo8oOyAwKgG4snZQVaI5BwZmi7HLKs0mbFMVweEFhpVqMGioHOcBSSFADUMCChIJISVJsIgBmdm4g8gTJII8QwH4Q5cjwVChOlHICtgowIMAdFgO1dhlKCsRQJEUBiT0MnVYO9wBAA5HAwZcFQC0DDo8n3oc+WFWYRX+f+tREPJyndSKYqSocMCFYKm0spFMQskAA)

```typescript{11}
function debounce<T extends (...args: any[]) => Promise<any>>(f: T, wait: number): (...args: Parameters<T>) => Promise<Awaited<ReturnType<T>>> {
  type R = Awaited<ReturnType<T>>;
  let lastPromise: Promise<R>;
  let lastTime: number = 0;
  return (...args: Parameters<T>): Promise<R> => {
    if (Date.now() - lastTime > wait) {
      // 超出上一次防抖区间或第一次调用
      lastPromise = f.apply(null, args);  
    }
    lastTime = Date.now();
    return lastPromise.then(() => lastPromise);
  };
}

// TESTING CODE!!!
const fn = debounce(asyncRun, 5000);
let i = 0;
const run = () => setTimeout(() =>{
  const expect = i;
  fn(i + 1, i).then((res) => console.log(`try to get result: ${expect}, actually: ${res}`)).catch(r => console.log('fail: ', r));
  if (i++ < 10) {
    run();
  }
}, 1000 * (i + 1));
run();
```





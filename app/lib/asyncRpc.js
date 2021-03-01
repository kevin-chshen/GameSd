/**
 * 将某个函数转换成返回Promise
 * @param {*} rpc 
 * @param  {...any} params 
 */
const rpcAsync = (rpc, ...params)=>{
    return new Promise((resolve , _reject)=>{
        rpc(...params, (err, res)=>{
            resolve({err, res});
        });
    });
};

/**
 * 将pomelo的rpc的所有方法转换成返回Promise
 * @param {*} rpc 
 */
const rpcAsyncTrans = (rpc)=>{
    const rpcs = {};
    for(const server in rpc){
        rpcs[server] = {};
        for(const remoteName in rpc[server]){
            rpcs[server][remoteName] = {};
            for(const method in rpc[server][remoteName]){
                rpcs[server][remoteName][method] = async function(...params){
                    return new Promise((resolve , _reject)=>{
                        rpc[server][remoteName][method](...params, (err, res)=>{
                            resolve({err, res});
                        });
                    });
                };

                rpcs[server][remoteName][method].toServer = async function(...params){
                    return new Promise((resolve , _reject)=>{
                        rpc[server][remoteName][method].toServer(...params, (err, res)=>{
                            resolve({err, res});
                        });
                    });
                };
            }
        }
    }
    return rpcs;
};

module.exports = {
    rpcAsyncTrans,
    rpcAsync
};
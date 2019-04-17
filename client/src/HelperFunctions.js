// /client/src/HelperFunctions.js

function isDict(v) {
    return typeof v==='object' && v!==null && !(v instanceof Array) && !(v instanceof Date);
}

function average(arr) {
    // Calculate the average over a numeric array
    const arrAvg = arr => arr.reduce((a,b) => a + b, 0) / arr.length;
    return arrAvg;
}

function compareArrays(arr1,arr2){
  
    if (!arr1 || !arr2 || !Array.isArray(arr1) || Array.isArray(arr2)) return
  
    let result;
    
    arr1.forEach((e1, i) => arr2.forEach(e2 => {	
        if (e1.length > 1 && e2.length){
            result = compareArrays(e1,e2);
        } else if (e1 !== e2 ) {
            result = false
        } else {
            result = true
        }
    })
		)

    return result    
}

export { isDict, average, compareArrays };

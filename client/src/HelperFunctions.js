// /client/src/HelperFunctions.js

function isDict(v) {
    return typeof v==='object' && v!==null && !(v instanceof Array) && !(v instanceof Date);
}

function average(arr, precision=3) {
    // Calculate the average over a numeric array
    if (!Array.isArray(arr) || !arr.length) {
	return
    }
    return (sum(arr) / arr.length).toFixed(precision);
}

function sum(arr) {
    if (!Array.isArray(arr) || !arr.length) {
        return
    }
    return arr.reduce( (a, b) => Number(a) + Number(b) );
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

function round(value, precision) {
    var multiplier = Math.pow(10, precision || 0);
    return Math.round(value * multiplier) / multiplier;
}

export { isDict, average, sum, compareArrays, round };

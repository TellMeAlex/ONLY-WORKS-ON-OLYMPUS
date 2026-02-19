const pattern1 = "(.*)*";
const pattern2 = "(.+)+";
const pattern3 = "(a+)+"; // nested quantifiers
const nestedQuantifiers = /(\([^)]*[+*?][^)]*\)[+*?]|([+*?][+*?]))/;
console.log("Pattern1", pattern1, "nested:", nestedQuantifiers.test(pattern1));
console.log("Pattern2", pattern2, "nested:", nestedQuantifiers.test(pattern2));
console.log("Pattern3", pattern3, "nested:", nestedQuantifiers.test(pattern3));

const pattern4 = "^.*test";
const unboundedDot = /(^|\s)\.\*|\.\*$|\.\*\.\*/;
console.log("Pattern4", pattern4, "unbounded:", unboundedDot.test(pattern4));

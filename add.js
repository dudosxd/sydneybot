export async function promptinize(out) {

    // Use a different delimiter for the regular expression
    const re = /^(>IMAGINE|> IMAGINE|->IMAGINE|-> IMAGINE|>I-MAGINE|> I-MAGINE|->I-MAGINE|-> I-MAGINE) (.*)$/gm;

    // Add a newline character to the input
    const str = out + '\n';

    // Use matchAll to get all the matches
    const matches = str.matchAll(re);
    
    let result = [];

    // Convert the iterator to an array
    result = Array.from(matches);

    // Use map to get only the second capture group
    result = result.map(match => match[2]);

    return result;
}

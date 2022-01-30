// shorten the checksummed version of the input address to have 4 characters at start and end
export function shortenAddress(address: string, chars = 4): string {
    return `${address.slice(0, chars)}...${address.slice(-chars)}`;
}

export function round(num: number): number {
    const res = Math.round((num + Number.EPSILON) * 100) / 100
    if(isNaN(res)) {
        return 0
    }
    return res
}

export function isValidHttpUrl(input: string) {
    let url;
    
    try {
      url = new URL(input);
    } catch (_) {
      return false;  
    }
  
    return url.protocol === "http:" || url.protocol === "https:";
  }

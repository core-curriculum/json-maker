
const defaultOption = { l: "{", r: "}" } as const
type Option = Partial<typeof defaultOption>

const fmt = (text: string, dict: { [key: string]: string }, option: Option = defaultOption) => {
  const escapeRegExp = (str: string) => str.replace(/[-\/\\^$*+?.()|\[\]{}]/g, "\\$&");
  const opt = option ? { ...option, ...defaultOption } : defaultOption;
  const [l, r] = [opt.l, opt.r].map(text => escapeRegExp(text));
  const key = `${l}(${Object.keys(dict).map(key => escapeRegExp(key)).join("|")})${r}`;
  return text.replace(new RegExp(key, "g"), (_, match) => {
    return match in dict ? dict[match] : match;
  })
}



export { fmt }
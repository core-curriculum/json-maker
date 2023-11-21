const localeList = ["en", "ja"] as const;
type Locale = typeof localeList[number];


export { localeList, type Locale };

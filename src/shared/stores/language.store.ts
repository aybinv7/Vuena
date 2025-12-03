export const useLanguageStore = defineStore("language", () => {
  const { locale } = useI18n();

  const language = ref(
    localStorage.getItem("user-lang") ||
      navigator.languages[0]?.split("-")[0] ||
      "en"
  );

  document.documentElement.dir = language.value === "ar" ? "rtl" : "ltr";

  const setLanguage = (lang: string) => {
    language.value = lang;
    locale.value = lang;
    localStorage.setItem("user-lang", lang);
    document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
  };

  const langDirection = computed(() => {
    return locale.value === "ar" ? "rtl" : "ltr";
  });

  return {
    language,
    langDirection,
    setLanguage,
  };
});

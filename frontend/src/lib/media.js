export const mediaLibrary = {
  home: {
    hero: {
      url: "https://res.cloudinary.com/djd3pyml9/image/upload/v1775623485/3M0128_ct0ki3.png",
      alt: "Нурик на главном экране",
      label: "Главное фото",
      title: "Лицо компании",
      description: "Подключите сюда основную фотографию Нурика по внешнему URL.",
    },
    company: {
      url: "https://res.cloudinary.com/djd3pyml9/image/upload/v1775623501/2M0128_axnqxh.png",
      alt: "Нурик и команда",
      label: "О компании",
      title: "Рабочий портрет",
      description: "Подходит для блока о надёжности, опыте и доверии.",
    },
    persona: {
      url: "https://res.cloudinary.com/djd3pyml9/image/upload/v1775623507/1M0128_g7p9xa.png",
      alt: "Нурик в фирменном образе",
      label: "Фирменный блок",
      title: "Брендовый кадр",
      description: "Лучшее место для самой запоминающейся и слегка ироничной фотографии.",
    },
  },
  publicPages: {
    request: {
      url: "",
      alt: "Иллюстрация оформления заявки",
      label: "Приём заявок",
      title: "Заявки принимаются ежедневно",
      description: "Можно подключить спокойное деловое фото или кадр с объектом.",
    },
    login: {
      url: "",
      alt: "Иллюстрация входа для сотрудников",
      label: "Служебный доступ",
      title: "Вход для сотрудников",
      description: "Подходит строгое фото без избыточного юмора.",
    },
  },
};

export function hasMedia(url) {
  return typeof url === "string" && url.trim().length > 0;
}

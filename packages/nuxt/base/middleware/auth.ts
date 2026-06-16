// @see https://strapi.nuxtjs.org/advanced#auth-middleware
export default defineNuxtRouteMiddleware(async (to) => {
  const user = useStrapiUser();

  if (user.value) {
    return;
  }

  const { redirectToLoginWithToast } = useAuthRedirect();
  return redirectToLoginWithToast(to.fullPath);
});

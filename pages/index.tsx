import type { GetServerSideProps, NextPage } from 'next';
import { CntrlClient, Page, PageProps, cntrlSdkContext } from '@gxpl/sdk';

const CntrlPage: NextPage<PageProps> = (props) => {
  cntrlSdkContext.init({
    project: props.project,
    articles: Object.values(props.articlesData).map(({ article }) => article),
  });
  return (
    <Page {...props} />
  );
}

export const getServerSideProps: GetServerSideProps<PageProps> = async () => {
  const client = new CntrlClient(process.env.CNTRL_API_URL!);
  const props = await client.getPageData();
  return { props };
};

export default CntrlPage;

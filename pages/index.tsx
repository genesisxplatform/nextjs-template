import type { GetStaticProps, NextPage } from 'next';
import { CntrlClient, Page, PageProps, cntrlSdkContext } from '@gxpl/sdk';

const client = new CntrlClient(process.env.CNTRL_API_URL!);
const buildMode = process.env.CNTRL_BUILD_MODE!;

const CntrlPage: NextPage<PageProps> = (props) => {
  cntrlSdkContext.init({
    project: props.project,
    articles: Object.values(props.articlesData).map(({ article }) => article),
  });
  return (
    <Page {...props} />
  );
}

export const getStaticProps: GetStaticProps<PageProps> = async () => {
  const props = await client.getPageData(buildMode === 'self-hosted' ? 'self-hosted' : 'default');
  return { props };
};

export default CntrlPage;

import type { APIRoute } from 'astro';
import { learningMaterials } from '../../../features/great-ui/site-content.ts';
import { buildSite } from '../../../config/site.ts';
import { currentDemoProof } from '../../../../scripts/great-ui-proof.ts';

export async function getStaticPaths() {
  const { entries, index, capabilities } = learningMaterials(undefined, 'zh', buildSite().origin);
  if (!entries.length) return [];
  const proof = await currentDemoProof();
  return [
    { file: 'catalog', data: index },
    { file: 'capabilities', data: capabilities },
    {
      file: 'demo-proof',
      data: { adapterRevision: proof.adapterRevision, records: proof.records },
    },
    ...entries.map((entry) => ({ file: entry.slug, data: entry })),
  ].map(({ file, data }) => ({ params: { file }, props: { data } }));
}
export const GET: APIRoute = ({ props, url }) =>
  new Response(
    JSON.stringify(
      import.meta.env.DEV && props.data.publicUrl
        ? {
            ...props.data,
            publicUrl: new URL(new URL(props.data.publicUrl).pathname, url.origin).href,
          }
        : props.data,
    ),
    {
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
    },
  );

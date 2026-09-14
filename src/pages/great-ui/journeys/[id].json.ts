import type { APIRoute } from 'astro';
import { projects } from '../../../features/great-ui/journey/data.ts';
export function getStaticPaths() {
  return projects.map((project) => ({ params: { id: project.id }, props: { project } }));
}
export const GET: APIRoute = ({ props }) =>
  new Response(JSON.stringify(props.project), {
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });

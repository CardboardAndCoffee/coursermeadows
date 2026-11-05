# Storyblok schema

`schema.mjs` defines the CMS components; `node storyblok/schema.mjs` writes `components.json`.

Not yet pushed to a real space. Once a Storyblok space exists, push `components.json` with the Storyblok CLI or the Management API (`POST /v1/spaces/{space_id}/components`), then check the editor screens look right. Field labels and help text are written for the farm's editor, not developers.

# RecipeSite

This is an unorignally named site to organise my recipes. It's built with node.js, and one of the nicest things about it is the ability to search anything on it. This used to be slow, so now the search index is cached in git rather than generating it (a better solution is make the site generic, and have a separate database for both recipes and searching).

## Docker

If you want to use docker for this, you'll want commands like:

- `docker build -t recipe-site .`
- `docker run -p <your-port>:8080 recipe-site`, e.g. `docker run -p 3000:8080 recipe-site`

## CI

![github test badge](https://github.com/davidcorne/RecipeSite/actions/workflows/docker-image.yml/badge.svg)

[![Codacy Badge](https://api.codacy.com/project/badge/Grade/8e51634dc26e4788af427a28f1c5d369)](https://www.codacy.com/app/davidcorne/RecipeSite?utm_source=github.com&amp;utm_medium=referral&amp;utm_content=davidcorne/RecipeSite&amp;utm_campaign=Badge_Grade)

## Standard

[![JavaScript Style Guide](https://cdn.rawgit.com/standard/standard/master/badge.svg)](https://github.com/standard/standard)

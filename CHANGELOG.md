# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
[markdownlint](https://dlaa.me/markdownlint/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [3.0.0] - 2024-10-17

The `entity-search-webapp` now _REQUIRES_ the use of the [senzing-poc-server](https://github.com/senzing-garage/senzing-poc-server/) to provide it's senzing api access. This is a change from before where you could use either the [senzing-api-server](https://github.com/senzing-garage/senzing-api-server) _OR_ the [senzing-poc-server](https://github.com/senzing-garage/senzing-poc-server/).

### Changed in 3.0.0

- Dependency updates.
- Searches can now survive a page reload
- Route Resolvers changed from Class to Fn

### Added in 3.0.0

- New Landing page
  - Donut widget displaying how many records have been loader for each datasource.
  - License widget displays how much of your current license is being used and it's expiration date.
- Cross Source Comparison widget. Allows selection of a data source or two and selection of the type of matches or relations for sample browsing.
  - Sample browsing Data Table widget. Is populated from the user's selection from the Cross Source Comparison widget and allows the user to browse through a sample-set that matches the parameters selected.

## [2.9.4] - 2024-03-16

### Changed in 2.9.4

- Removed 'SSO' integration variables. SSO authentication/redirects should be handled at the network/formation level instead of by the individual container.

## [2.9.3] - 2024-01-18

### Changed in 2.9.3

- Dependency updates.

## [2.9.2] - 2023-11-14

### Changed in 2.9.2

- Create arm64 Docker image

## [2.9.1] - 2023-09-29

### Changed in 2.9.1

- In `Dockerfile`, updated FROM instruction to:
  - `node:16-bullseye-slim@sha256:503446c15c6236291222f8192513c2eb56a02a8949cbadf4fe78cce19815c734`
  - `node:16-alpine3.18@sha256:a1f9d027912b58a7c75be7716c97cfbc6d3099f3a97ed84aa490be9dee20e787`

## [2.9.0] - 2023-09-09

### Changed in 2.9.0

- new graph icons.
- match keys are now shown by default in the graph.
- new why and why not report column formatting to match g2Explorer.

### Added in 2.9.0

- @senzing/sdk-components-ng updated to 6.1.0
  - "How" entity report component(s) added.
    - Added `SzHowEntityComponent` component which is the only component that should be used at an implementation level. The other components listed below are components that this component uses to create things like different color cards, nested trees, navigation, groups etc.
- Added new `/how/${entityId}` route to application to display a how report for a specific entity.
- Update dependencies to latest compatible versions

## [2.8.2] - 2023-06-29

### Changed in 2.8.2

- In `Dockerfile`, updated FROM instruction to:
  - `node:16-bullseye-slim@sha256:726698a073f984efd26cb31c176a35b39200c4a82f4dc6f933c7cc957403b567`
  - `node:16-alpine3.17@sha256:fb4c5fcefe7cf706ab7f9eed97258641f33ca318b03f072119180133ab3ef334`
- Update dependencies
  - socket.io-parser:4.2.3

## [2.8.1] - 2023-05-11

### Changed in 2.8.1

- In `Dockerfile`, updated FROM instruction to:
  - `node:16-bullseye-slim@sha256:7ee0b958bd5f47f54b58f2b9932b1975a4d98d8f332bd2134c2b65514cadb6c6`
  - `node:16-alpine3.17@sha256:f1657204d3463bce763cefa5b25e48c28af6fe0cdb0f68b354f0f8225ef61be7`
- Update dependencies
  - http-cache-semantics:4.1.1
  - node_modules/http-cache-semantics:4.1.1
  - node_modules/ua-parser-js:0.7.33
  - ua-parser-js:0.7.33

## [2.8.0] - 2023-01-20

### Changed in 2.8.0

- Angular framework updated to @15.x.x
- Material toolkit updated to @15.x.x
- D3 charting toolkit updated to @7.x.x
- `@senzing/rest-api-client-ng` updated to @6.0.0
- `@senzing/sdk-components-ng` updated to @6.0.0
- Dependency Security updates (various)

## [2.7.4] - 2023-01-12

### Changed in 2.7.4

- In `Dockerfile`, updated FROM instruction to:
  - `node:16-bullseye-slim@sha256:cfb2b5e2b39f341056ac624d32fae00ba0ab94145364111b7edfd9db703526e0`
  - `node:16-alpine3.16@sha256:e023c53915c5e20df594809477dc249dd595a8e731a6e214c4dbdcf7431bf942`

## [2.7.3] - 2022-10-27

### Changed in 2.7.3

- In `Dockerfile`, updated FROM instruction to:
  - `node:16-bullseye-slim@sha256:5c9f79e11b4f867582241b5e7db96bbe1893fad8c1f523261690c743d0950667`
  - `node:16-alpine3.16@sha256:f16544bc93cf1a36d213c8e2efecf682e9f4df28429a629a37aaf38ecfc25cf4`

## [2.7.2] - 2022-09-28

### Changed in 2.7.2

- In `Dockerfile`, updated FROM instruction to:
  - `node:16-bullseye-slim@sha256:18ae6567b623f8c1caada3fefcc8746f8e84ad5c832abd909e129f6b13df25b4`
  - `node:16-alpine3.15@sha256:a60b681e1c28f60ea63f8394dea5384c69bdc464b9655e880f74aafaa5945665`

## [2.7.1] - 2022-08-02

### Added in 2.7.1

- added new radio switch for graph match key filtering scope
- added "unlimited" UI options for buildOut and maxEntities graph filtering parameters

### Modified in 2.7.1

- bugfixes for large graph match key filtering
- bugfixes for large graph FOC
- graph match key filters now de-select on entity id(s) change
- bugfixes for graph lifecycle progress/busy indicators.

relevant tickets: #299 #321 #302 #324

## [2.7.0] - 2022-07-07

This update adds the long-awaited _Expand/Collapse_ graph node edge feature.
Now nodes in the graph will display a bubble with the number of relationships not currently visible.
Relationships can be explored by simply expanding relationships down a path.
The _Why Not_ report can now be run from specific integration points.
The why not report will run a side-by-side table of two entities information in order to help illustrate why two entities did not come together.

### Added in 2.7.0

- New graph features:
  - On clicking the bubble the hidden related entities will be drawn around the node.
  - On clicking the expand/collapse bubble again the related nodes that are not related to any other nodes on the canvas will be hidden.
  - On right clicking the node there is a new option to hide just that specific entity from view(to eliminate clutter)
  - On right clicking the relationship line match key there will be a menu option for running a _Why NOT_ report between the two connected entities
- There is a new _Multi-Select_ mode button in the upper right-corner of search results.
  Once the button is clicked a user can click on two search results and click on "Compare" to bring up
  a "Why NOT" report for why those two entities did not come together.
- Match keys are now displayed in the search result cards by default. _(they can be turned off through preferences)_

## [2.6.0] - 2022-05-09

This update brings the models in line with the changes for the `3.0.0` release of the
[senzing rest api server](https://github.com/senzing-garage/senzing-api-server)
and [rest api specification](https://github.com/senzing-garage/senzing-rest-api-specification/blob/caceres.version-3.0.0/senzing-rest-api.yaml).

### Added in 2.6.0

- "Filter By Match Key" added back to the large graph display using a more user-friendly approach of a \_"Tag Cloud" of match key tokens.
- Why Entity feature that adds a button to the entity detail page that opens a
  draggable/resizable window with a horizontal side-by-side view of why records in an entity came together
- Why Entity feature that adds a button to the entity detail page's record rows that opens a
  draggable/resizable window with a horizontal side-by-side view of why that particular record in an entity came together

### Modified in 2.6.0

- Major refactoring done under the hood inside the admin area and data importing functionality due to the removal of entity types/classes.
- `@senzing/rest-api-client-ng` updated to `4.0.0`
- `@senzing/sdk-graph-components` updated to `4.1.0-beta.1`
- `@senzing/sdk-components-ng` updated to `4.0.0-beta.7`
- UI fixes (various)

### Removed in 2.6.0

- Any and all functionality surrounding _Entity Type's_ and _Entity Classes_.
  Management of these features has been removed in the 3.0 version of the senzing sdk.

relevant tickets: #265 #263 #261 #258

## [2.5.0] - 2022-02-28

![EDA Tools Console](docs/img/release/151086453-a276b67c-fad7-411e-a540-f0252a50fe28.png?raw=true "EDA Tools Console")

### Modified in 2.5.0

- dependency updates to resolve security bulletins
- bugfix for json/json-lines analyze functions switched from `streamAnalyzeByRecords` to `streamAnalyzeByChunks`
- bugfix for json/json-lines loading functions switched from `streamLoadByRecords` to `streamLoadByChunks`

### Added in 2.5.0

- Optional Web Console Access to the [senzing-web-app-console](https://github.com/senzing-garage/entity-search-web-app-console) container.
  Users can now run popular shell tools like
  [G2Explorer.py](https://senzing.zendesk.com/hc/en-us/articles/360051768234-Exploratory-Data-Analysis-2-Basic-exploration),
  [G2Snapshot.py](https://senzing.zendesk.com/hc/en-us/articles/360051874294-Exploratory-Data-Analysis-3-Taking-a-snapshot) and
  [G2Audit.py](https://senzing.zendesk.com/hc/en-us/articles/360050643034-Exploratory-Data-Analysis-4-Comparing-ER-results)
  from within the context of the container through the web interface.

### Removed in 2.5.0

- "Filter By Match Key" removed from the large graph display due to _usability_ issues on large datasets.
  _(It will return once a better approach can be implemented)_

relevant tickets: #242 #243 #246 #252 #256

## [2.4.0] - 2021-12-28

### Added in 2.4.0

- `/health` route that returns a model shape of `{"isProxyAlive": true, "isApiServerAlive": true, "isWebserverAlive": true}`
- `/health/proxy` route that returns the status of the proxy
- [HealthCheckerUtility](https://github.com/senzing-garage/entity-search-web-app/blob/master/run/health/index.js)
  that provides state management for health status checks.

### Modified in 2.4.0

- Angular Framework Updated to version 13. As of 3.0.0 release this package now requires `@angular@~13.0.0` to compile and run.
  Updating to angular 13 resolves major dependency compatibility issues so we can apply the latest security patches.
- Small bugfix to properly clip the graph scale ui control when graph section in entity detail is collapsed.
- All dependencies updated to latest versions
- Docker container now based off of `lts-alpine`(nodejs@16) instead of `14-alpine`(nodejs@14)
- Docker container now gets `npm` itself deleted from container after build phase since it is not needed for runtime to minimize security exposure.
- Dockerfile updated to wire HEALTHCHECK's to the new
  [/health/check script](https://github.com/senzing-garage/entity-search-web-app/blob/master/run/health/check.js)

relevant tickets: #230 #231 #235 #195

## [2.3.4] - 2021-12-01

### Added in 2.3.4

- The ability to filter graph elements by "match keys" present on the links between graph entities. #215
- The ability to import CSV files when using SQS stream loading. #217
- _Zoom_ and _Pan_ controls added to embedded and standalone Network Graph components. #216
- Ability to filter by _Match Keys_ present on the links between graph entities in the dataset added to standalone Network Graph component. #215
- List of _ALL_ command line flags and environment variables for configuration of the docker container.
  See [docs/Environment Variables](https://github.com/senzing-garage/entity-search-web-app/blob/master/docs/Environment%20Variables.md) #218

### Modified in 2.3.4

- "Search By Record Id" now returns full entity NOT just "record". #220
- bugfix for #222. introduced by #215
- bugfix for #226. introduced by #220
- dependencies updated

relevant tickets #226 #222 #220 #218 #216 #217 #215

## [2.3.3] - 2021-10-14

- Added multi-stage build to `Dockerfile` so that only production dependencies and
  compiled code is present in immutable container.
- Removed Google Chrome from container (was used for container e2e testing)
- Removed `travis.yml` from project.
- Added test runner(s) back via Github Action workflows.

## [2.3.2] - 2021-09-09

- removed the re-mapping UI interaction in admin/load when an import contains explicitly specified datasources on the record level.
  If the record contains an explicit datasource that is what the record will be loaded in to.
  If the datasource specified does not exist it will be created.
  If the file contains records that have _NO_ datasource specified the user will be prompted to enter one before load.
- removed the UI interaction in admin/load around custom entity types.
  Now if a imported file specifies a specific entity type that does not exist it is created.
  If no entity type is specified it is automatically assumed `GENERIC`.
- Added a "Admin" menu option in the upper-left site menu _WHEN_ the poc or api server has "-adminEnabled" set.
- bugfixes related to stream loading (various, see relevant tickets)

relevant tickets #189 #190 #192 #196 #198 #200 #202 #204

## [2.3.1] - 2021-08-26

The configuration options/setup surrounding the stream loading feature released in
[2.3.0](https://github.com/senzing-garage/entity-search-web-app/releases/tag/2.3.0) has been simplified.
Now stream loading is automatically enabled for the user **_IF_** the webapp is running against a
**[POC Server](https://github.com/senzing-garage/senzing-poc-server)** that has SQS configured.
If not configured properly or running against the
[API server](https://github.com/senzing-garage/senzing-api-server)(with adminMode=true set)
the loading feature will fallback to the **non**-stream method.
As a result of this streamlining the UI **_toggle switch_** and **"connection configuration"** modal has been _removed_ from the UI.

The following ENV vars introduced in `2.3.0` have been removed:

- `SENZING_STREAM_SERVER_URL`
- `SENZING_STREAM_SERVER_PORT`
- `SENZING_STREAM_SERVER_DEST_URL`
- `SENZING_WEB_SERVER_CSP_STREAM_SERVER_URL`

The following ENV var has been introduced:

- `SENZING_WEB_SERVER_URL` - The fully qualified url to the root of where the webapp is being served from.
  This is used to define in the webapp security policy that outbound socket connections are allowed to this address.
  - `http://my.public.domain/webapp`
  - `http://my.specific.domain:specificport`

The following cmdline args have been introduced:

- `webServerUrl` - see ENV var `SENZING_WEB_SERVER_URL` description

relevant tickets #180 #183 #185

## [2.3.0] - 2021-08-10

### Stream loading via websockets to the poc-server to rabbitMQ or Amazon SQS

This release is primarily to support stream loading which enables stream ingestion through
a web interface to the POC Server which hands off to the configured SQS provider.
The stream interface is capable of reading records in a file and sending them out in
small chunked batches either as quickly as they can be read or a fast as configured upload rate.

These features should be cross compatible with the standard API Server backend.
If the stack is set up with SQS ingestion and the backend is the POC Server then stream loading will be available.
If the backend is the standard API server then stream loading features will be hidden from the UI.

relevant tickets: #143 #179

## [2.2.4] - 2021-07-28

- support for runtime configuration of API path that client connects to through env vars and cmdline switches.
- bugfix for virtual directories
- dependency security updates
- docker image base is now `lts-buster-slim`

relevant tickets: #163 #166 #173

## [2.2.2,2.2.3] - 2021-04-08

- support for virtual directories
- support for AWS Cloud Formation
- webfonts now referenced locally
- dependency security updates
- bugfix for download as pdf functionality

relevant tickets: #147 #154, #156, #157

## [2.2.1] - 2021-02-01

- updated @senzing/sdk-graph-components to 2.1.3
- updated @senzing/sdk-components-ng to 2.2.1
- fixed bug where entity detail would not render when entity had 0 relationships.

## [2.2.0] - 2021-01-20

- updated senzing libs to 2.2.0
- bug in route resolver to only accept numbers for record paths fixed
- Select Identifiers in Search Form feature added.

## [2.1.2] - 2020-12-20

- updated senzing libs to 2.2.0
- bug in route resolver to only accept numbers for record paths fixed

## [2.1.1] - 2020-10-02

Bugfixes for:

- [Large graph filtering](https://github.com/senzing-garage/sdk-graph-components/issues/27)
- [Large graph color highlights by datasource](https://github.com/senzing-garage/sdk-components-ng/issues/162)
- [Detail Graph lifecycle issue on in-component navigation](https://github.com/senzing-garage/sdk-components-ng/issues/156)
- [Graph tooltips showing null for address and phone numbers](https://github.com/senzing-garage/sdk-graph-components/issues/42)
- [Entity Id added to detail report](https://github.com/senzing-garage/sdk-components-ng/issues/159)
- [Search by Attribute option pinned to menu options](https://github.com/senzing-garage/entity-search-web-app/issues/131)
- [Best name logic fix](https://github.com/senzing-garage/sdk-components-ng/issues/156)

## [2.1.0] - 2020-09-23

Compatibility release for framework upgrade to Angular 10:
See [https://blog.angular.io/version-10-of-angular-now-available-78960babd41](https://blog.angular.io/version-10-of-angular-now-available-78960babd41)

Major updates to most dependency versions have also been made which should improve file sizes, security, and stability.

The following Senzing sponsored projects have also been updated to operate on Angular 10,
see the following links for associated tickets:

- [sdk-components-ng/issues/143](https://github.com/senzing-garage/sdk-components-ng/issues/143)
- [rest-api-client-ng/issues/39](https://github.com/senzing-garage/rest-api-client-ng/issues/39)
- [sdk-graph-components/issues/37](https://github.com/senzing-garage/sdk-graph-components/issues/37)

## [2.0.1] - 2020-09-21

The scripts no longer write any configuration or runtime configuration information to the filesystem.
Instead, the options are read from either ENV vars or Command Line arguments in to a data store class,
which is then accessed by scripts and endpoints that need access to these arguments.
This was done to support immutable containers. See
[Ensure that your containers are stateless and immutable](https://cloud.google.com/solutions/best-practices-for-operating-containers#ensure_that_your_containers_are_stateless_and_immutable).

Added:

- run/runtime.datastore.js
- run/runtime.datastore.config.js
- src/app/services/config.service.ts
- Interactive TTY "type any key to quit" web server prompt

Removed:

- proxy.conf.tmpl.json
- auth/auth.conf.json
- auth/auth.conf.tmpl.admin.json
- auth/auth.conf.tmpl.full.json
- auth/auth.conf.tmpl.json
- auth/cors.conf.tmpl.json
- any direct references to static files ie: /auth/auth.conf.json in ts files

Moved:

- auth-server.js → run/authserver/index.js
- auth/auth.js → run/authserver/auth.js
- webserver.js → run/webserver/index.js

### Updated ENV Vars REQUIRED

There are several NEW env vars/command args that now are required for full operation, your docker formations or scripts should be updated.

## [2.0.0] - 2020-07-16

Compatibility release for interacting with the 2.0.0
[senzing-rest-api-spec](https://github.com/senzing-garage/senzing-rest-api-specification) and
[senzing-api-server](https://github.com/senzing-garage/senzing-api-server).
For information on specifics of endpoint changes see below:

- [@senzing/rest-api-client-ng@2.0.0](https://github.com/senzing-garage/rest-api-client-ng/releases/tag/2.0.0)
- [senzing-rest-api-specification PR #44](https://github.com/senzing-garage/senzing-rest-api-specification/pull/44)
- [senzing-api-server PR #172](https://github.com/senzing-garage/senzing-api-server/pull/172)

## [1.2.1] - 2020-04-24

### Added to 1.2.1

- Show version information (for diagnostics)
- Open search results directly in Graph view
- Allow the user to collapse/expand the filters/detail drawer in the Graph view.
- Added MSSQL support
- Added Search by _record Id_ or _entity Id_ form interfaces
- Added Record JSON viewer
- Added Admin functionality. (see [Readme](https://github.com/senzing-garage/entity-search-web-app#admin-area) for more details)
  - added ability to view datasources available to an instance
  - added ability to do bulk import or csv or json files in to a datasource
  - added randomly generated JWT token to `/admin` routes by default. other authentication options include external SSO relay and NONE.
- Implemented CORS support for allowing the container to tell the client to directly request api resources. Default is disabled.
- Implemented CSP (Content Security Policy) - enabled by default. see #96 for more details.
- relevant tickets:
  [#66](https://github.com/senzing-garage/entity-search-web-app/pull/66),
  [#67](https://github.com/senzing-garage/entity-search-web-app/pull/67),
  [#68](https://github.com/senzing-garage/entity-search-web-app/pull/68),
  [#73](https://github.com/senzing-garage/entity-search-web-app/pull/73),
  [#74](https://github.com/senzing-garage/entity-search-web-app/pull/74),
  [#76](https://github.com/senzing-garage/entity-search-web-app/pull/76),
  [#83](https://github.com/senzing-garage/entity-search-web-app/pull/83),
  [#84](https://github.com/senzing-garage/entity-search-web-app/pull/84),
  [#89](https://github.com/senzing-garage/entity-search-web-app/pull/89),
  [#96](https://github.com/senzing-garage/entity-search-web-app/pull/96)

![image](docs/img/release/80262048-14e88380-8641-11ea-9a66-3455d8e3b044.png)
![image](docs/img/release/80262278-c8ea0e80-8641-11ea-9672-c105a99a45d9.png)

### Admin Functionality

![image](docs/img/release/80262370-15354e80-8642-11ea-8361-ce98abf5c5f7.png)
![image](docs/img/release/80262410-31d18680-8642-11ea-8633-7139911cea68.png)
![image](docs/img/release/80262422-37c76780-8642-11ea-881b-afe32219f4b9.png)
![image](docs/img/release/80262433-3dbd4880-8642-11ea-9ecf-fd3465ef85b8.png)

## [1.0.4] - 2019-11-19

### Added to 1.0.4

- Standalone graph.
- graph filtering.
- embedded rail-format entity detail viewer (for graph)
- search result(s) directly displayed in standalone graph.
- graph color(s) by datasource membership.
- SSL support for docker image.
- basic auth support (alpha) for docker image.
- premature loading indicator disappearing fix.
- relevant tickets:
  [#34](https://github.com/senzing-garage/entity-search-web-app/pull/34),
  [#67](https://github.com/senzing-garage/entity-search-web-app/pull/67),
  [#69](https://github.com/senzing-garage/entity-search-web-app/pull/69),
  [#71](https://github.com/senzing-garage/entity-search-web-app/pull/71)

![2019-11-19_154007](docs/img/release/69196314-04a50900-0ae3-11ea-9ef4-74903c507360.png)
![2019-11-19_154500](docs/img/release/69196516-96ad1180-0ae3-11ea-9848-7d868d874a01.png)

## [1.0.3] - 2019-09-30

### Added to 1.0.3

- [sdk-components-ng](https://github.com/senzing-garage/sdk-components-ng) updated to
  [1.0.9](https://github.com/senzing-garage/sdk-components-ng/releases/tag/1.0.9) and
  [sdk-graph-components](https://github.com/senzing-garage/sdk-graph-components) updated to
  [0.0.6](https://github.com/senzing-garage/sdk-graph-components/releases/tag/0.0.6)

![2019-09-30_122901](docs/img/release/65909647-eaba3600-e37d-11e9-92f8-2d8f7e4ceca3.png)

- Preferences UI interface added to top ribbon
- Added [SzPrefsService](https://senzing.github.io/sdk-components-ng/injectables/SzPrefsService.html)
- Added [SzPreferencesComponent](https://senzing.github.io/sdk-components-ng/components/SzPreferencesComponent.html)
- CSS for responsive breakpoint(s) and/or reflow on narrow width
- Various UI/UX layout bugfixes
- Graph should reload on entityIdChange
- Graph should collapse on _0_ results
- Include "other data" in records area.
- Text highlighting no longer triggers click-thru
- Search identifiers drop-down should auto-update on api config change

## [1.0.2] - 2019-08-03

### Added to 1.0.2

- SDK components updated to [1.0.8](https://github.com/senzingiris/sdk-components-ng/releases/tag/1.0.8)
- Graph components updated to [0.0.4](https://github.com/senzing-garage/sdk-graph-components/releases)
- PDF downloads
- minor UI/UX changes

### Fixed in 1.0.2

- identifier dropdown issue
- proxy.conf perm issue
- entity icon fixes
- graph overflow issue
- relevant tickets:
  [#32](https://github.com/senzing-garage/entity-search-web-app/pull/32),
  [#36](https://github.com/senzing-garage/entity-search-web-app/pull/36),
  [#47](https://github.com/senzing-garage/entity-search-web-app/pull/47),
  [#51](https://github.com/senzing-garage/entity-search-web-app/pull/51),
  [#53](https://github.com/senzing-garage/entity-search-web-app/pull/53)

## [1.0.1] - 2019-06-26

### Added to 1.0.1

- e2e tooling
- wonky graph styling issue
- basic unit tests fixes
- sdk-components-ng version bump. 1.0.4 -> **1.0.5**
- adds license badge to readme. [![License](https://img.shields.io/github/license/senzing/entity-search-web-app.svg)](https://github.com/senzing-garage/entity-search-web-app/blob/master/LICENSE)
- adds `npm run e2e`, `npm run e2e:headless`, `npm run test`, and `npm run test:headless` scripts
- added .travis.yml for CI build/test integration
- angular.json configuration changes to support path refactoring

## [1.0.0] - 2019-06-20

### Added to 1.0.0

- Initial release of the entity search web app.

# Elysia dan Arsitektur Backend TypeScript

> Status: keputusan arsitektur yang disetujui untuk pekerjaan berikutnya.
> Dokumen ini adalah discussion/explanation, bukan implementation plan. Guidance
> yang operasional akan dipindahkan ke `.agent/` saat perubahan diterapkan.

## Latar belakang

`vkit-orbit` adalah boilerplate domain-neutral. Salah satu aplikasi yang
diturunkan darinya adalah `reminder-web`. Aplikasi tersebut membuktikan bahwa
fondasi Elysia, TanStack Start, Prisma, River, dan Go worker dapat digunakan
bersama. Ia juga menunjukkan risiko yang harus dicegah oleh boilerplate:

- composition root API dapat tumbuh menjadi tempat wiring Prisma, provider
  eksternal, transaction, dan read model domain;
- route handler dapat melakukan mutasi langsung ke repository alih-alih
  memakai batas usecase yang seragam;
- object `Dependencies` yang disuntikkan ke `createApp` dapat berkembang
  menjadi dependency graph yang sulit diikuti; dan
- prefix API yang ditulis pada setiap feature route menyulitkan versioning.

Tujuan perubahan berikutnya bukan menyalin bentuk `reminder-web`. Tujuannya
adalah memperkuat `vkit-orbit` agar aplikasi yang diturunkan sesudahnya tidak
berkembang ke bentuk tersebut.

## Fokus tahap pertama

Tahap pertama hanya memperbaiki API Elysia yang saat ini di-embed oleh
`apps/web`. API tetap memiliki satu host public pada baseline saat ini, tetapi
struktur internalnya harus memungkinkan sebuah API definition di-embed atau
dijalankan sebagai server mandiri pada masa depan.

Ruang lingkup tahap pertama:

- mengubah endpoint public dari `/api/*` menjadi kumpulan route
  `/api/v1/*`, lalu memungkinkan `/api/v2/*` dan seterusnya;
- menyusun route, plugin, schema response, dan OpenAPI dengan pola Elysia yang
  konsisten;
- menegaskan batas command mutation dan query; dan
- menulis guidance serta guard yang mencegah boundary tersebut melonggar.

Hal berikut sengaja ditunda:

- membuat atau mendeploy `api-public` dan `api-mobile`;
- memecah `apps/web` menjadi `web-landing`;
- refactor besar pada scheduler atau realtime; dan
- refactor `reminder-web`.

`reminder-web` tetap menjadi validasi arsitektur yang berguna, tetapi bukan
scope perubahan boilerplate ini.

## Versioning HTTP API

Versi adalah kumpulan handler dan kontrak HTTP yang tersedia bersamaan.
Kehadiran v2 tidak otomatis mendeprekasi v1. Deprecation adalah metadata dan
keputusan lifecycle per operasi, bukan efek samping dari nomor versi baru.

Struktur URL yang disetujui:

```text
/api/v1/*                       API public v1
/api/v2/*                       API public v2, jika dan ketika dibutuhkan
/api/internal/worker-events     gateway internal, tidak di-version sebagai API public
/api/docs                       satu Scalar documentation UI
/api/openapi.json               satu dokumen OpenAPI gabungan
/health                         liveness process
/health/ready                   readiness process
```

Dokumentasi dan OpenAPI tidak dibuat per versi. Satu dokumen OpenAPI memuat
semua path yang sedang dipasang, termasuk `/api/v1/...` dan `/api/v2/...`.
Operasi yang masih tersedia tetapi menuju penghentian diberi metadata
`deprecated` pada OpenAPI.

Setiap API definition memakai pembangun group yang eksplisit:

```ts
createRoutes(version: number)
```

Fungsi tersebut memvalidasi bahwa `version` adalah positive integer, memberi
prefix `/api/v${version}`, dan memberi nama plugin Elysia yang jelas, misalnya
`api-v1`. Ia adalah factory struktur route, bukan dependency injection.
Collection v1 dan v2 dibuat serta dipasang secara eksplisit. Tidak boleh ada
switch bisnis tersembunyi berdasarkan nomor versi di dalam handler.

## API definition dan host process

API definition harus terpisah dari cara ia di-host. Hal ini membuat kontrak
Elysia yang sama dapat dipakai dalam dua mode:

```text
web-landing process
  └─ embeds api-public Elysia application

mobile client
  └─ HTTPS → api-mobile process/container
```

Pada baseline sekarang, `apps/web` meng-embed Elysia melalui adapter TanStack
Start. Adapter hanya meneruskan request asli ke `app.fetch`; ia tidak membuat
proxy jaringan dan tidak menduplikasi handler API.

Pada masa depan, `api-public` dapat tetap di-embed oleh `web-landing`, sedangkan
`api-mobile` dapat menjadi container HTTP mandiri. Keduanya boleh memiliki
read model dan kontrak transport berbeda, tetapi tidak boleh menduplikasi
aturan mutation TypeScript yang sama.

### Singleton adalah per proses

Singleton tidak berlaku sekali untuk seluruh monorepo atau lintas container.
Ia berlaku sekali dalam setiap runtime JavaScript. Karena itu setiap proses
yang menjalankan API, scheduler, atau realtime memiliki satu instance yang
dibuat pada bootstrap runtime-nya, seperti config tervalidasi, logger, Prisma
client, River client, atau client provider yang relevan.

Module `runtime.ts` pada pemilik proses adalah tempat deklarasi singleton
tersebut. `server.ts` adalah satu-satunya tempat yang memanggil `.listen()`.
API yang di-embed hanya mengimpor application Elysia; ia tidak ikut menjalankan
server entrypoint.

## Mutation: command per runtime

Mutation harus memakai usecase yang eksplisit pada runtime pemiliknya.
Keseragaman berarti semua mutation melalui batas command yang benar, bukan
berarti satu bahasa harus memanggil implementasi bahasa lain.

Untuk runtime TypeScript:

```text
Elysia vN mutation route
→ validasi HTTP, authentication, dan policy
→ mapping input vN ke command canonical
→ @repo/application command/usecase
→ transaction dan database
→ mapping hasil ke response vN
```

Aturan ini berlaku untuk semua host TypeScript yang mungkin ada: API embedded,
`api-public`, `api-mobile`, atau consumer TypeScript lain. Route tidak membuat
Prisma client, tidak mengandung Prisma mutation, dan tidak menyimpan business
rule atau transaction domain.

Satu command dapat dipakai oleh v1 dan v2 apabila semantiknya sama. Perbedaan
version hanya berada pada mapping transport. Command baru dibuat hanya ketika
semantik bisnisnya memang berubah.

### Go worker

Go worker adalah runtime terpisah dan kodenya berada pada root `internal/`,
bukan `apps/worker/internal`. Ia boleh memiliki usecase, repository, dan
transaction boundary Go yang mengimplementasikan mutasi yang ekuivalen dengan
usecase TypeScript.

Duplikasi implementasi lintas TypeScript dan Go diperbolehkan. Yang wajib
selaras adalah:

- invariant dan semantik bisnis;
- idempotency serta aturan concurrency;
- kontrak River (`kind` dan payload JSON yang versioned); dan
- scenario test penting pada kedua runtime bila keduanya memutasi state yang
  sama.

Go worker tetap mengelola lifecycle, retry, idempotency, dan wiringnya sendiri;
Uber FX dapat digunakan di Go. Ia tidak perlu memanggil endpoint HTTP
TypeScript untuk menjalankan mutasi internal.

Konsekuensinya, guidance lama yang melarang worker Go menduplikasi TypeScript
usecase perlu diperbarui ketika desain ini diimplementasikan.

## Query: fleksibel, tetapi eksplisit

Query tidak wajib menjadi usecase agar simetris dengan command. Bentuk query
ditentukan oleh consumer dan dapat menjadi read adapter atau read model
feature-specific.

- Query untuk satu API atau layar boleh ditempatkan bersama feature API yang
  menggunakannya.
- `api-public` dan `api-mobile` boleh memiliki projection dan respons query
  yang berbeda.
- Query yang sungguh dipakai lintas consumer dapat diekstrak ke package khusus
  kemudian, bukan lebih awal.
- Hanya `packages/database` yang membuat Prisma client. Consumer query memakai
  instance yang telah dimiliki package tersebut; mereka tidak membuat client
  baru.
- Authorization, filtering scope, dan bentuk respons tetap merupakan
  tanggung jawab boundary HTTP yang mengekspos query.

## Tanpa dependency-injection container di TypeScript

TypeScript tidak memakai DI container atau production `Dependencies` object
yang bertumbuh untuk membuat application graph. Runtime module membuat
singletonnya satu kali dan route atau usecase memakai module boundary yang
jelas.

Ini tidak melarang factory murni seperti `createRoutes(1)`, helper parser, atau
function yang menerima input bisnis. Yang dihindari adalah membuat setiap
route/application factory menerima daftar panjang repository, provider client,
dan callback hanya untuk merakit runtime production.

Testing mengikuti batas tersebut:

- unit test menguji business rule murni;
- integration test menguji database dan side effect dengan environment
  terisolasi; dan
- API test menguji exported Elysia application melalui `app.handle` atau
  `app.fetch`.

Test tidak boleh menjadi alasan untuk membawa container DI ke jalur production.

## Struktur target

Struktur ini adalah arah saat beberapa HTTP server telah diperlukan; tidak
semua folder dibuat pada tahap pertama.

```text
apps/
  web-landing/                  host UI; dapat embed api-public
  api-public/                   Elysia API definition dan optional server entry
  api-mobile/                   Elysia API definition dan standalone server entry
  scheduler/                    schedule → enqueue saja
  realtime/                     Socket.IO runtime dan private publisher

packages/
  application/                  command/usecase mutation TypeScript
  database/                     satu Prisma client per proses dan DB primitives
  queue/                        River contracts dan producer primitives
  http-elysia/                  convention Elysia lintas server, tanpa domain/runtime state

internal/
  ...                           Go worker usecase, repository, dan handler
```

`packages/http-elysia` hanya menampung concern yang benar-benar HTTP/Elysia
lintas server, seperti version-group builder, envelope/schema, plugin request
context dan error mapping, serta utility OpenAPI/deprecation. Package tersebut
tidak mengetahui domain, Prisma query, provider eksternal, atau usecase bisnis.

## Pola Elysia

API Elysia berikutnya mengikuti prinsip berikut:

- application root hanya memasang plugin dan route collection; ia bukan lokasi
  implementasi domain atau wiring feature;
- route dikelompokkan per feature di bawah version collection;
- request ID, logging, error envelope, dan docs authorization menjadi plugin
  atau lifecycle hook yang scoped dengan tepat;
- auth/policy yang dipakai banyak route menggunakan guard atau macro, sehingga
  401/403 tidak berulang di setiap handler;
- setiap route public mendeklarasikan schema request dan response yang relevan;
  ini menjaga Eden dan OpenAPI tetap akurat; dan
- response failure yang diketahui mengikuti envelope yang sama, sedangkan error
  tak terduga tetap disanitasi oleh error boundary pusat.

Pola tersebut selaras dengan dokumentasi resmi Elysia mengenai plugin
composition, lifecycle, validation, guard/macro, response schema, Eden, dan
OpenAPI. Lihat [Elysia documentation](https://elysiajs.com/llms.txt) dan
[Elysia plugin guidance](https://elysiajs.com/essential/plugin).

### Collection query contract

Collection `GET` route memakai macro Elysia `collection` yang tersedia dari
`createRoutes(version)`. Route mendeklarasikan `defineCollection(...)` sekali;
macro tersebut memasang schema TypeBox, mengubah query tervalidasi menjadi
input typed, dan menghasilkan parameter OpenAPI dari schema yang sama.

Kontrak cursor mengikuti nama JSON:API: `page[size]`, `page[after]`, dan
`page[before]`. Sorting memakai bentuk `sort=-createdAt,id`; filtering memakai
`filter[field]` atau operator yang dideklarasikan endpoint; `q` hanya ada bila
endpoint menjelaskan cakupan search-nya. Semua parameter public memiliki
description berbahasa Inggris pada schema OpenAPI.

Kemampuan query merupakan whitelist endpoint, bukan representasi Prisma yang
dipublikasikan. Cursor menyimpan posisi ordering dan fingerprint sort/filter/
search yang dinormalisasi. Respons collection menambahkan `meta.page` dan link
relatif canonical `self`, `next`, dan `prev` ke success envelope. Validation
schema, termasuk cursor yang tidak valid atau tidak kompatibel, mengembalikan
failure envelope HTTP 422.

### Dokumentasi handler sebagai kontrak

Setiap handler Elysia, termasuk health dan handler internal yang disembunyikan,
memiliki `summary`, `description`, dan tag berbahasa Inggris melalui helper
`apiOperation`. Summary menyebut operasi, sementara description menjelaskan
hasil, cakupan, serta alasan keputusan transport yang tidak lazim. `operationId`
tidak ditulis manual: plugin OpenAPI Elysia menghasilkannya dari HTTP method dan
path endpoint.

OpenAPI adalah kontrak yang diuji, bukan artefak best-effort. Semua parameter,
field payload, dan field respons memiliki description serta example; setiap
status respons yang dideklarasikan memiliki description dan contoh JSON.
Factory envelope menerima description/example respons supaya pola tersebut
seragam. Validator atas dokumen OpenAPI hasil generasi memeriksa operasi public
dan guard source memeriksa semua file route, termasuk handler `hide: true`.

Pengecualian `t.Any()` bersifat lokal dan harus dijelaskan dalam description
operasi. Contohnya, gateway worker mengautentikasi header sebelum memvalidasi
body agar payload malformed tanpa credential tetap menghasilkan 401, bukan 422.
Aturan ini menjaga keamanan behavior sekaligus membuat pengecualian terlihat
jelas pada source code.

## Guidance dan guard yang akan ditambahkan

Saat implementasi dimulai, aturan ini akan dipindahkan ke guidance yang
operasional:

- `.agent/backend-typescript.md`: ownership backend TypeScript, singleton
  per-process, boundary API definition versus host, serta larangan DI container
  production;
- `.agent/api/README.md`: version collection, route/plugin/schema convention,
  mutation/query policy, OpenAPI, dan deprecation;
- `.agent/scheduler/README.md` serta `.agent/realtime/README.md`: lifecycle
  singleton dan batas mutasi masing-masing runtime; dan
- `.agent/worker/README.md`: ownership `internal/` dan kesetaraan semantik
  usecase Go/TypeScript.

Comment source hanya ditambahkan pada boundary yang tidak terlihat dari type,
misalnya pada `runtime.ts`, `app.ts`, dan `server.ts`. Comment tidak dipakai
untuk mengulang kode atau menggantikan guidance.

Guard test atau lint akan menegakkan aturan yang dapat diverifikasi, misalnya:

- public route harus berada dalam `/api/vN` collection;
- route mutation tidak mengimpor Prisma atau melakukan Prisma mutation;
- application root tidak memuat wiring domain/provider feature; dan
- web tidak mengimpor database atau application usecase.

## Urutan pekerjaan berikutnya

1. Implementasikan version collection pada API Elysia yang saat ini di-embed
   oleh web, dimulai dengan `/api/v1/status`.
2. Pisahkan concern Elysia yang lintas feature: envelope/schema, error handling,
   request context, dan OpenAPI/deprecation.
3. Tambahkan guidance dan guard arsitektur yang disepakati.
4. Tambahkan command/usecase mutation dan query adapter mengikuti pola ini saat
   domain pertama dipasang.
5. Hanya ketika kebutuhan deployment muncul, ekstrak API definition ke
   `api-public` atau `api-mobile` tanpa mengubah batas command yang telah
   dibangun.

Keputusan ini sengaja bertahap: tahap pertama memperbaiki baseline yang sudah
berjalan, sambil menjaga jalan ekspansi untuk beberapa HTTP server tanpa
premature abstraction.

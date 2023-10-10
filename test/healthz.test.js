// import supertest from 'supertest';
// import app from '../api/app.js';

// describe('GET /healthz', () => {
//   it('responds with 200 OK', (done) => {
//     supertest(app)
//       .get('/healthz')
//       .expect(200, done);
//   });
// });


import chai from "chai";
import chaiHttp from "chai-http";
import app from '../api/app.js';
const expect = chai.expect;

chai.use(chaiHttp);

describe("GET /healthz endpoint test", () => {
  it("should return success upon connection", async() => {
    chai
      .request(app)
      .get("/healthz")
      .end((err, res) => {
        if (err) return done(err)
        expect(res).to.have.status(200);
      });
  });
});
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';
import * as fs from 'fs';
import * as path from 'path';
import { SupportedFileType } from '../../src/documents/enums/supported-file-type.enum';

describe('Document Conversion String (e2e)', () => {
  let app: INestApplication;
  let exampleTxt: string;
  let exampleXml: string;
  let exampleJson: string;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    // Load example files
    exampleTxt = fs.readFileSync(path.join(process.cwd(), 'example.txt'), 'utf-8');
    exampleXml = fs.readFileSync(path.join(process.cwd(), 'example.xml'), 'utf-8');
    exampleJson = fs.readFileSync(path.join(process.cwd(), 'example.json'), 'utf-8');
  });

  afterEach(async () => {
    await app.close();
  });

  it('should convert string to JSON', () => {
    return request(app.getHttpServer())
      .post('/documents/convert')
      .send({
        content: exampleTxt,
        convertFrom: SupportedFileType.STRING,
        convertTo: SupportedFileType.JSON,
        lineSeparator: '~',
        elementSeparator: '*',
      })
      .expect(200)
      .expect('Content-Type', /json/)
      .then(response => {
        const expectedObj = {
          root: {
            ProductID: [
              {
                ProductID1: '4',
                ProductID2: '8',
                ProductID3: '15',
                ProductID4: '16',
                ProductID5: '23'
              },
              {
                ProductID1: 'a',
                ProductID2: 'b',
                ProductID3: 'c',
                ProductID4: 'd',
                ProductID5: 'e'
              }
            ],
            AddressID: [
              {
                AddressID1: '42',
                AddressID2: '108',
                AddressID3: '3',
                AddressID4: '14'
              }
            ],
            ContactID: [
              {
                ContactID1: '59',
                ContactID2: '26'
              }
            ]
          }
        };
        const actualObj = JSON.parse(response.text);
        expect(actualObj).toEqual(expectedObj);
      });
  });

  it('should convert string to XML', () => {
    return request(app.getHttpServer())
      .post('/documents/convert')
      .send({
        content: exampleTxt,
        convertFrom: SupportedFileType.STRING,
        convertTo: SupportedFileType.XML,
        lineSeparator: '~',
        elementSeparator: '*',
      })
      .expect(200)
      .expect('Content-Type', /xml/)
      .then(response => {
        // Remove whitespace and newlines for comparison
        const expectedXml = exampleXml.replace(/\s+/g, '');
        const actualXml = response.text.replace(/\s+/g, '');
        expect(actualXml).toBe(expectedXml);
      });
  });

  it('should handle missing separators', () => {
    return request(app.getHttpServer())
      .post('/documents/convert')
      .send({
        content: exampleTxt,
        convertFrom: SupportedFileType.STRING,
        convertTo: SupportedFileType.JSON,
        // Missing separators
      })
      .expect(400)
      .expect(response => {
        expect(response.body.message).toContain('Both line separator and element separator must be provided');
      });
  });

  it('should handle empty string input', () => {
    return request(app.getHttpServer())
      .post('/documents/convert')
      .send({
        content: '',
        convertFrom: SupportedFileType.STRING,
        convertTo: SupportedFileType.JSON,
        lineSeparator: '~',
        elementSeparator: '*',
      })
      .expect(400)
      .expect(response => {
        expect(response.body.message).toContain('Either file or content is required');
      });
  });

  it('should handle invalid separator combinations', () => {
    return request(app.getHttpServer())
      .post('/documents/convert')
      .send({
        content: 'test*data~next*line',
        convertFrom: SupportedFileType.STRING,
        convertTo: SupportedFileType.JSON,
        lineSeparator: '*',  // Same as elementSeparator
        elementSeparator: '*',
      })
      .expect(400)
      .expect(response => {
        expect(response.body.message).toContain('Line separator and element separator must be different');
      });
  });

  it('should handle string with special characters', () => {
    const specialContent = 'item*value with spaces~item*special@#$chars';
    return request(app.getHttpServer())
      .post('/documents/convert')
      .send({
        content: specialContent,
        convertFrom: SupportedFileType.STRING,
        convertTo: SupportedFileType.JSON,
        lineSeparator: '~',
        elementSeparator: '*',
      })
      .expect(200)
      .expect('Content-Type', /json/)
      .then(response => {
        const result = JSON.parse(response.text);
        expect(result).toEqual({
          root: {
            item: [
              { item1: 'value with spaces' },
              { item1: 'special@#$chars' }
            ]
          }
        });
      });
  });
});

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';
import * as fs from 'fs';
import * as path from 'path';
import { SupportedFileType } from '../../src/documents/enums/supported-file-type.enum';

describe('Document Conversion JSON (e2e)', () => {
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

  it('should convert JSON to XML', () => {
    return request(app.getHttpServer())
      .post('/documents/convert')
      .send({
        content: exampleJson,
        convertFrom: SupportedFileType.JSON,
        convertTo: SupportedFileType.XML,
      })
      .expect(200)
      .expect('Content-Type', /xml/)
      .then(response => {
        const expectedXml = `<?xml version="1.0" encoding="UTF-8"?>
<root>
  <ProductID>
    <ProductID1>4</ProductID1>
    <ProductID2>8</ProductID2>
    <ProductID3>15</ProductID3>
    <ProductID4>16</ProductID4>
    <ProductID5>23</ProductID5>
  </ProductID>
  <ProductID>
    <ProductID1>a</ProductID1>
    <ProductID2>b</ProductID2>
    <ProductID3>c</ProductID3>
    <ProductID4>d</ProductID4>
    <ProductID5>e</ProductID5>
  </ProductID>
  <AddressID>
    <AddressID1>42</AddressID1>
    <AddressID2>108</AddressID2>
    <AddressID3>3</AddressID3>
    <AddressID4>14</AddressID4>
  </AddressID>
  <ContactID>
    <ContactID1>59</ContactID1>
    <ContactID2>26</ContactID2>
  </ContactID>
</root>`.replace(/\s+/g, '');
        const actualXml = response.text.replace(/\s+/g, '');
        expect(actualXml).toBe(expectedXml);
      });
  });

  it('should convert JSON to string', () => {
    const input = JSON.stringify({
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
    });

    return request(app.getHttpServer())
      .post('/documents/convert')
      .send({
        content: input,
        convertFrom: SupportedFileType.JSON,
        convertTo: SupportedFileType.STRING,
        lineSeparator: '~',
        elementSeparator: '*',
      })
      .expect(200)
      .expect('Content-Type', /text/)
      .then(response => {
        const lines = response.text.split('~').filter(line => line.trim());
        expect(lines).toHaveLength(4);
        expect(lines[0]).toBe('ProductID*4*8*15*16*23');
        expect(lines[1]).toBe('ProductID*a*b*c*d*e');
        expect(lines[2]).toBe('AddressID*42*108*3*14');
        expect(lines[3]).toBe('ContactID*59*26');
      });
  });

  it('should handle invalid JSON input', () => {
    return request(app.getHttpServer())
      .post('/documents/convert')
      .send({
        content: '{"invalid": "json"',  // Missing closing bracket
        convertFrom: SupportedFileType.JSON,
        convertTo: SupportedFileType.XML,
      })
      .expect(400)
      .expect(response => {
        expect(response.body.message).toContain('Failed to parse JSON');
      });
  });

  it('should handle empty JSON object', () => {
    return request(app.getHttpServer())
      .post('/documents/convert')
      .send({
        content: '{}',
        convertFrom: SupportedFileType.JSON,
        convertTo: SupportedFileType.XML,
      })
      .expect(200)
      .expect('Content-Type', /xml/)
      .then(response => {
        expect(response.text).toContain('<root></root>');
      });
  });

  it('should handle nested JSON objects', () => {
    const nestedJson = JSON.stringify({
      root: {
        item: [
          {
            id: '1',
            name: 'test',
            details: {
              type: 'example',
              value: '123'
            }
          }
        ]
      }
    });

    return request(app.getHttpServer())
      .post('/documents/convert')
      .send({
        content: nestedJson,
        convertFrom: SupportedFileType.JSON,
        convertTo: SupportedFileType.XML,
      })
      .expect(200)
      .expect('Content-Type', /xml/)
      .then(response => {
        const xml = response.text;
        expect(xml).toContain('<item>');
        expect(xml).toContain('<item1>example</item1>');
        expect(xml).toContain('<item2>123</item2>');
        expect(xml).toContain('<item3>1</item3>');
        expect(xml).toContain('<item4>test</item4>');
      });
  });
});

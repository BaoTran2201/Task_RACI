import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.join(__dirname, 'public', 'data');

const SCHEMAS = {
    departments: ['id', 'name', 'active', 'createdAt', 'updatedAt'],
    positions: ['id', 'name', 'canManage', 'active', 'createdAt', 'updatedAt'],
    employees: ['id', 'name', 'department', 'position', 'managerId', 'createdAt', 'updatedAt', 'departmentId', 'positionId'],
    projects: ['id', 'name', 'customer', 'createdAt', 'updatedAt'],
    tasks: ['id', 'name', 'groupName', 'frequency', 'note', 'partner', 'partnerId', 'projectId', 'creatorId', 'createdAt', 'updatedAt', 'estimatedHours'],
    raci_assignments: ['id', 'taskId', 'role', 'createdAt', 'updatedAt', 'employeeId'],
    users: ['id', 'username', 'password', 'role', 'employeeId', 'createdAt', 'updatedAt', 'isActive', 'isStaff'],
};

function parseValue(val) {
    if (val === '') return null;
    if (val === 't') return true;
    if (val === 'f') return false;
    if (!isNaN(val) && val.trim() !== '') return Number(val);
    return val;
}

function convertFile(filename) {
    const filePath = path.join(DATA_DIR, filename);
    if (!fs.existsSync(filePath)) {
        console.warn(`File not found: ${filename}`);
        return;
    }

    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split('\n').filter(line => line.trim() !== '');
    const schema = SCHEMAS[filename];

    if (!schema) {
        console.warn(`No schema for: ${filename}`);
        return;
    }

    const data = lines.map(line => {
        // Basic comma split - doesn't handle commas inside quotes, 
        // but the raw data doesn't seem to have them based on samples.
        // If it does, we'd need a more robust CSV parser.
        const parts = line.split(',');
        const obj = {};
        schema.forEach((key, index) => {
            obj[key] = parseValue(parts[index] !== undefined ? parts[index] : '');
        });
        return obj;
    });

    const outputFilename = `${filename}.json`;
    const outputPath = path.join(DATA_DIR, outputFilename);
    fs.writeFileSync(outputPath, JSON.stringify(data, null, 2));
    console.log(`Converted ${filename} to ${outputFilename}`);
}

Object.keys(SCHEMAS).forEach(convertFile);

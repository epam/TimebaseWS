import { Component, OnInit } from '@angular/core';
import { ImportFromTextFileService } from '../../../services/import-from-text-file.service';
import { SchemaAllTypeModel, SchemaTypeModel, UISchemaAllTypeModel } from 'src/app/shared/models/schema.type.model';

@Component({
  selector: 'app-new-stream-schema',
  templateUrl: './new-stream-schema.component.html',
  styleUrls: ['./new-stream-schema.component.scss']
})
export class NewStreamSchemaComponent implements OnInit {

  public schemaItems: UISchemaAllTypeModel[];
  private inintialScema: { types: SchemaTypeModel[], all: SchemaAllTypeModel[] };
  private finalScema: { types: SchemaTypeModel[], all: SchemaAllTypeModel[] };
  private checkedTypes: string[];
  private checkedFields: { [key: string]: string[] } = {};

  constructor(private importFromTextFileService: ImportFromTextFileService) { }

  ngOnInit(): void {
    this.schemaItems = this.getSchemaItemList();
    setTimeout(() => this.importFromTextFileService.schemaIsValid$.next(!!this.inintialScema.types.length));
  }

  public toggleFieldsVisibility(className: string) {
    this.schemaItems = this.schemaItems.map(schemaItem => {
      if (schemaItem.name === className) {
        return {
          ...schemaItem,
          fieldsOpen: !schemaItem.fieldsOpen
        }
      } else {
        return schemaItem;
      }
    })
  }

  private getSchemaItemList() {
    const schema = this.importFromTextFileService.createdStreamSchema;
    const schemaItemsUse = schema.types.map(type => type.name);
    this.inintialScema = schema;

    const schemaItemListLength = schema.all.reduce((acc, item) => acc + 1 + item.fields.length, 0);

    return schema.all.map(schemaItem => {
      const hierarchy = [];
      let currentSchemaItem = schemaItem;
      while (currentSchemaItem.parent) {
        hierarchy.push(currentSchemaItem.parent);
        currentSchemaItem = schema.all.find(i => i.name === currentSchemaItem.parent);
      }
      return {
        ...schemaItem,
        fieldList: schemaItem.fields.map(field => ({...field, checked: true})),
        hierarchy,
        fieldsOpen: schemaItemListLength < 20,
        checked: true,
        use: schemaItemsUse.includes(schemaItem.name)
      }
    }).sort((i1, i2) => i1.hierarchy.length < i2.hierarchy.length ? -1 : 1);
  }

  public typeListChanged(event, targetSchemaItem: UISchemaAllTypeModel, manualChange = true) {
    const checked = event.target.checked;
    this.schemaItems = this.schemaItems.map(schemaItem => {
      if (checked) {
        if (schemaItem.name === targetSchemaItem.name) {
          return {
            ...schemaItem,
            checked: true,
            fieldList: manualChange ? schemaItem.fieldList.map(field => ({ ...field, checked: true })) : schemaItem.fieldList
          };
        } else if (targetSchemaItem.hierarchy.includes(schemaItem.name)) {
          const noCheckedFields = schemaItem.fieldList.every(field => !field.checked);
          return {
            ...schemaItem,
            checked: true,
            fieldList: noCheckedFields ? 
              schemaItem.fieldList.map(field => ({ ...field, checked: true })) : schemaItem.fieldList
          };
        } else {
          return schemaItem;
        }
      } else {
        if (schemaItem.name === targetSchemaItem.name || schemaItem.hierarchy.includes(targetSchemaItem.name)) {
          return {
            ...schemaItem,
            checked: false,
            fieldList: schemaItem.fieldList.map(field => ({ ...field, checked: false }))
          };
        } else {
          return schemaItem;
        }
      }
    })
    this.checkedTypes = this.schemaItems.filter(item => item.checked).map(item => item.name);
    this.schemaItems.forEach(schemaItem => {
      this.checkedFields[schemaItem.name] = schemaItem.fieldList.filter(field => field.checked).map(field => field.name);
    })
    this.setStreamSchema();
  }

  public fieldListChanged(event, targetSchemaItem: UISchemaAllTypeModel, fieldName: string) {
    const checked = event.target.checked;

    this.schemaItems = this.schemaItems.map(schemaItem => {
      const typeChecked = schemaItem.checked;
      if (checked && schemaItem.name === targetSchemaItem.name) {
        if (!typeChecked) {
          setTimeout(() => this.typeListChanged({ target: { checked: true }}, schemaItem, false), 500);
        }
        return {
          ...schemaItem,
          checked: true,
          fieldList: schemaItem.fieldList.map(field => field.name === fieldName ? ({ ...field, checked: true }) : field)
        };
      } else if (!checked && schemaItem.name === targetSchemaItem.name) {
        const checkedFieldsNumber = !schemaItem.checked ? 0 : schemaItem.fieldList.filter(field => field.checked).length;
        if (checkedFieldsNumber <= 1) {
          setTimeout(() => this.typeListChanged({ target: { checked: false }}, schemaItem, false), 500);
        }
        return {
          ...schemaItem,
          checked: checkedFieldsNumber > 1,
          fieldList: schemaItem.fieldList.map(field => field.name === fieldName ? ({ ...field, checked: false }) : field)
        };
      } else {
        return schemaItem;
      }
    })
    this.schemaItems.forEach(schemaItem => {
      this.checkedFields[schemaItem.name] = schemaItem.fieldList.filter(field => field.checked).map(field => field.name);
    })
    this.setStreamSchema();
  }

  private setStreamSchema() {
    this.finalScema = {
      types: this.inintialScema.types
        .filter(type => !this.checkedTypes ? true : this.checkedTypes.includes(type.name))
        .map(type => ({
          ...type,
          fields: type.fields.filter(field => this.checkedFields?.[type.name].includes(field.name))
        })),
      all: this.inintialScema.all
        .filter(type => !this.checkedTypes ? true : this.checkedTypes.includes(type.name))
        .map(type => ({
          ...type,
          fields: type.fields.filter(field => this.checkedFields?.[type.name].includes(field.name))
        })),
    }

    const schemaIsValid = !!this.finalScema.types.length;
    this.importFromTextFileService.schemaIsValid$.next(schemaIsValid);
    if (schemaIsValid) {
      this.importFromTextFileService.createdStreamSchema = this.finalScema;
    }
  }
}

# -*- coding: utf-8 -*-
import datetime
from south.db import db
from south.v2 import SchemaMigration
from django.db import models


class Migration(SchemaMigration):

    def forwards(self, orm):
        # Adding model 'OriginGroup'
        db.create_table('insight_origingroup', (
            ('id', self.gf('django.db.models.fields.AutoField')(primary_key=True)),
            ('title', self.gf('django.db.models.fields.CharField')(max_length=50)),
            ('description', self.gf('django.db.models.fields.TextField')(null=True, blank=True)),
        ))
        db.send_create_signal('insight', ['OriginGroup'])

        # Adding model 'Origin'
        db.create_table('insight_origin', (
            ('id', self.gf('django.db.models.fields.AutoField')(primary_key=True)),
            ('title', self.gf('django.db.models.fields.CharField')(max_length=50)),
            ('description', self.gf('django.db.models.fields.TextField')(null=True, blank=True)),
            ('code', self.gf('django.db.models.fields.CharField')(db_index=True, unique=True, max_length=7, blank=True)),
            ('querystring_parameters', self.gf('django.db.models.fields.TextField')(null=True, blank=True)),
            ('number_of_registrations', self.gf('django.db.models.fields.IntegerField')(default=0)),
            ('origin_group', self.gf('django.db.models.fields.related.ForeignKey')(to=orm['insight.OriginGroup'], null=True, blank=True)),
        ))
        db.send_create_signal('insight', ['Origin'])

        # Adding model 'QuerystringParameter'
        db.create_table('insight_querystringparameter', (
            ('id', self.gf('django.db.models.fields.AutoField')(primary_key=True)),
            ('identifier', self.gf('django.db.models.fields.CharField')(max_length=32, db_index=True)),
            ('value', self.gf('django.db.models.fields.CharField')(max_length=50, db_index=True)),
            ('origin', self.gf('django.db.models.fields.related.ForeignKey')(to=orm['insight.Origin'])),
            ('number_of_registrations', self.gf('django.db.models.fields.IntegerField')(default=0)),
        ))
        db.send_create_signal('insight', ['QuerystringParameter'])

        # Adding unique constraint on 'QuerystringParameter', fields ['identifier', 'value', 'origin']
        db.create_unique('insight_querystringparameter', ['identifier', 'value', 'origin_id'])

        # Adding model 'Registration'
        db.create_table('insight_registration', (
            ('id', self.gf('django.db.models.fields.AutoField')(primary_key=True)),
            ('user', self.gf('django.db.models.fields.related.ForeignKey')(to=orm['auth.User'], unique=True)),
            ('origin', self.gf('django.db.models.fields.related.ForeignKey')(to=orm['insight.Origin'])),
            ('created', self.gf('django.db.models.fields.DateTimeField')(auto_now_add=True, blank=True)),
        ))
        db.send_create_signal('insight', ['Registration'])


    def backwards(self, orm):
        # Removing unique constraint on 'QuerystringParameter', fields ['identifier', 'value', 'origin']
        db.delete_unique('insight_querystringparameter', ['identifier', 'value', 'origin_id'])

        # Deleting model 'OriginGroup'
        db.delete_table('insight_origingroup')

        # Deleting model 'Origin'
        db.delete_table('insight_origin')

        # Deleting model 'QuerystringParameter'
        db.delete_table('insight_querystringparameter')

        # Deleting model 'Registration'
        db.delete_table('insight_registration')


    models = {
        'auth.group': {
            'Meta': {'object_name': 'Group'},
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'name': ('django.db.models.fields.CharField', [], {'unique': 'True', 'max_length': '80'}),
            'permissions': ('django.db.models.fields.related.ManyToManyField', [], {'to': "orm['auth.Permission']", 'symmetrical': 'False', 'blank': 'True'})
        },
        'auth.permission': {
            'Meta': {'ordering': "('content_type__app_label', 'content_type__model', 'codename')", 'unique_together': "(('content_type', 'codename'),)", 'object_name': 'Permission'},
            'codename': ('django.db.models.fields.CharField', [], {'max_length': '100'}),
            'content_type': ('django.db.models.fields.related.ForeignKey', [], {'to': "orm['contenttypes.ContentType']"}),
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'name': ('django.db.models.fields.CharField', [], {'max_length': '50'})
        },
        'auth.user': {
            'Meta': {'object_name': 'User'},
            'date_joined': ('django.db.models.fields.DateTimeField', [], {'default': 'datetime.datetime.now'}),
            'email': ('django.db.models.fields.EmailField', [], {'max_length': '75', 'blank': 'True'}),
            'first_name': ('django.db.models.fields.CharField', [], {'max_length': '30', 'blank': 'True'}),
            'groups': ('django.db.models.fields.related.ManyToManyField', [], {'to': "orm['auth.Group']", 'symmetrical': 'False', 'blank': 'True'}),
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'is_active': ('django.db.models.fields.BooleanField', [], {'default': 'True'}),
            'is_staff': ('django.db.models.fields.BooleanField', [], {'default': 'False'}),
            'is_superuser': ('django.db.models.fields.BooleanField', [], {'default': 'False'}),
            'last_login': ('django.db.models.fields.DateTimeField', [], {'default': 'datetime.datetime.now'}),
            'last_name': ('django.db.models.fields.CharField', [], {'max_length': '30', 'blank': 'True'}),
            'password': ('django.db.models.fields.CharField', [], {'max_length': '128'}),
            'user_permissions': ('django.db.models.fields.related.ManyToManyField', [], {'to': "orm['auth.Permission']", 'symmetrical': 'False', 'blank': 'True'}),
            'username': ('django.db.models.fields.CharField', [], {'unique': 'True', 'max_length': '30'})
        },
        'contenttypes.contenttype': {
            'Meta': {'ordering': "('name',)", 'unique_together': "(('app_label', 'model'),)", 'object_name': 'ContentType', 'db_table': "'django_content_type'"},
            'app_label': ('django.db.models.fields.CharField', [], {'max_length': '100'}),
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'model': ('django.db.models.fields.CharField', [], {'max_length': '100'}),
            'name': ('django.db.models.fields.CharField', [], {'max_length': '100'})
        },
        'insight.origin': {
            'Meta': {'ordering': "['title']", 'object_name': 'Origin'},
            'code': ('django.db.models.fields.CharField', [], {'db_index': 'True', 'unique': 'True', 'max_length': '7', 'blank': 'True'}),
            'description': ('django.db.models.fields.TextField', [], {'null': 'True', 'blank': 'True'}),
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'number_of_registrations': ('django.db.models.fields.IntegerField', [], {'default': '0'}),
            'origin_group': ('django.db.models.fields.related.ForeignKey', [], {'to': "orm['insight.OriginGroup']", 'null': 'True', 'blank': 'True'}),
            'querystring_parameters': ('django.db.models.fields.TextField', [], {'null': 'True', 'blank': 'True'}),
            'title': ('django.db.models.fields.CharField', [], {'max_length': '50'})
        },
        'insight.origingroup': {
            'Meta': {'object_name': 'OriginGroup'},
            'description': ('django.db.models.fields.TextField', [], {'null': 'True', 'blank': 'True'}),
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'title': ('django.db.models.fields.CharField', [], {'max_length': '50'})
        },
        'insight.querystringparameter': {
            'Meta': {'unique_together': "(('identifier', 'value', 'origin'),)", 'object_name': 'QuerystringParameter'},
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'identifier': ('django.db.models.fields.CharField', [], {'max_length': '32', 'db_index': 'True'}),
            'number_of_registrations': ('django.db.models.fields.IntegerField', [], {'default': '0'}),
            'origin': ('django.db.models.fields.related.ForeignKey', [], {'to': "orm['insight.Origin']"}),
            'value': ('django.db.models.fields.CharField', [], {'max_length': '50', 'db_index': 'True'})
        },
        'insight.registration': {
            'Meta': {'ordering': "['-created']", 'object_name': 'Registration'},
            'created': ('django.db.models.fields.DateTimeField', [], {'auto_now_add': 'True', 'blank': 'True'}),
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'origin': ('django.db.models.fields.related.ForeignKey', [], {'to': "orm['insight.Origin']"}),
            'user': ('django.db.models.fields.related.ForeignKey', [], {'to': "orm['auth.User']", 'unique': 'True'})
        }
    }

    complete_apps = ['insight']